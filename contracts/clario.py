# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json


class Clario(gl.Contract):
    notes: TreeMap[str, str]
    assessments: TreeMap[str, str]
    challenges: TreeMap[str, str]
    roles: TreeMap[str, str]
    audit_log: DynArray[str]
    protocol_version: str
    challenge_counter: u32

    def __init__(self) -> None:
        self.protocol_version = "1.0.0"
        self.challenge_counter = u32(0)
        admin_addr = str(gl.message.sender_address)
        self.roles[admin_addr] = "admin"
        ts = str(gl.message_raw["datetime"])
        self.audit_log.append(json.dumps({
            "event_type": "contract_deployed",
            "note_hash": "",
            "actor": admin_addr,
            "details": json.dumps({"protocol_version": "1.0.0"}),
            "timestamp": ts,
        }))

    # -----------------------------------------------------------------------
    # Role management
    # -----------------------------------------------------------------------

    @gl.public.write
    def grant_role(self, address: str, role: str) -> None:
        caller = str(gl.message.sender_address)
        assert self.roles.get(caller, "") == "admin", "Only admin can grant roles"
        assert role in ("submitter", "reviewer", "validator", "admin"), "Invalid role"
        self.roles[address] = role
        ts = str(gl.message_raw["datetime"])
        self.audit_log.append(json.dumps({
            "event_type": "role_granted",
            "note_hash": "",
            "actor": caller,
            "details": json.dumps({"address": address, "role": role}),
            "timestamp": ts,
        }))

    @gl.public.write
    def revoke_role(self, address: str) -> None:
        caller = str(gl.message.sender_address)
        assert self.roles.get(caller, "") == "admin", "Only admin can revoke roles"
        assert address != caller, "Cannot revoke own admin role"
        self.roles[address] = ""
        ts = str(gl.message_raw["datetime"])
        self.audit_log.append(json.dumps({
            "event_type": "role_revoked",
            "note_hash": "",
            "actor": caller,
            "details": json.dumps({"address": address}),
            "timestamp": ts,
        }))

    # -----------------------------------------------------------------------
    # Note submission + AI triage
    # -----------------------------------------------------------------------

    @gl.public.write
    def submit_note(self, note_hash: str, de_identified_text: str) -> None:
        caller = str(gl.message.sender_address)
        caller_role = self.roles.get(caller, "submitter")
        assert caller_role in ("submitter", "reviewer", "admin"), "Not authorized"
        assert note_hash not in self.notes, "Note already submitted"

        ts = str(gl.message_raw["datetime"])

        self.notes[note_hash] = json.dumps({
            "note_hash": note_hash,
            "de_identified_text": de_identified_text,
            "submitter": caller,
            "timestamp": ts,
            "status": "submitted",
        })

        self.audit_log.append(json.dumps({
            "event_type": "note_submitted",
            "note_hash": note_hash,
            "actor": caller,
            "details": json.dumps({"status": "submitted"}),
            "timestamp": ts,
        }))

        assessment = self._classify_note(note_hash, de_identified_text)

        status = "human_review" if assessment["human_review_required"] else "consensus_reached"

        self.assessments[note_hash] = json.dumps({
            "note_hash": note_hash,
            "category": assessment["category"],
            "priority_score": assessment["priority_score"],
            "confidence": assessment["confidence"],
            "reasoning": assessment["reasoning"],
            "missing_info": json.dumps(assessment.get("missing_info", [])),
            "routing_recommendation": assessment.get("routing_recommendation", ""),
            "human_review_required": assessment["human_review_required"],
            "human_review_reasons": json.dumps(assessment.get("human_review_reasons", [])),
            "critical_keywords_found": json.dumps(assessment.get("critical_keywords_found", [])),
            "protocol_version": self.protocol_version,
            "timestamp": ts,
        })

        note_data = json.loads(self.notes[note_hash])
        note_data["status"] = status
        self.notes[note_hash] = json.dumps(note_data)

        self.audit_log.append(json.dumps({
            "event_type": "note_assessed",
            "note_hash": note_hash,
            "actor": "system",
            "details": json.dumps({
                "category": assessment["category"],
                "priority_score": assessment["priority_score"],
                "confidence": assessment["confidence"],
                "human_review_required": assessment["human_review_required"],
                "status": status,
            }),
            "timestamp": ts,
        }))

    def _classify_note(self, note_hash: str, text: str) -> dict:
        critical_keywords = [
            "chest pain", "severe bleeding", "stroke symptoms",
            "suicidal thoughts", "breathing difficulties", "loss of consciousness"
        ]

        text_lower = text.lower()
        found_keywords = [kw for kw in critical_keywords if kw in text_lower]
        force_human_review = len(found_keywords) > 0

        prompt = (
            "You are a clinical administrative triage assistant. "
            "You prioritize clinical notes for administrative routing. "
            "You NEVER diagnose patients or recommend treatment.\n\n"
            "Analyze this de-identified clinical note and provide an administrative triage assessment.\n\n"
            "NOTE:\n" + text + "\n\n"
            "Respond with ONLY a valid JSON object:\n"
            '{"category": "<emergency|urgent|same_day|routine|administrative>", '
            '"priority_score": <integer 1-100>, '
            '"confidence": <integer 1-100>, '
            '"reasoning": "<brief explanation>", '
            '"missing_info": ["<list items>"], '
            '"routing_recommendation": "<where to route>", '
            '"human_review_required": <true or false>, '
            '"human_review_reasons": ["<reasons>"]}\n\n'
            "Rules:\n"
            "- Emergency: severe symptoms needing immediate administrative action\n"
            "- Urgent: worsening symptoms, moderate severity\n"
            "- Same-Day: persistent issues needing same-day attention\n"
            "- Routine: standard follow-ups, refills\n"
            "- Administrative: scheduling, billing, general inquiries\n"
            "- Set human_review_required=true if confidence < 90\n"
            "- NEVER diagnose. NEVER recommend treatment."
        )

        kw_list = found_keywords
        force_review = force_human_review

        def nondet():
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(res, dict):
                parsed = res
            else:
                res = str(res).replace("```json", "").replace("```", "").strip()
                parsed = json.loads(res)
            valid_cats = ["emergency", "urgent", "same_day", "routine", "administrative"]
            assert parsed.get("category") in valid_cats
            assert 1 <= parsed.get("priority_score", 0) <= 100
            assert 1 <= parsed.get("confidence", 0) <= 100
            return json.dumps(parsed, sort_keys=True)

        comparison_prompt = (
            "Compare these two clinical triage assessments. "
            "They are equivalent if they assign the same category AND "
            "the priority scores are within 15 points of each other. "
            "Minor wording differences in reasoning are acceptable. "
            "Answer ONLY 'True' if equivalent or 'False' if not."
        )

        result_str = gl.eq_principle.prompt_comparative(nondet, comparison_prompt)
        result = json.loads(result_str)

        if force_review:
            result["human_review_required"] = True
            reasons = result.get("human_review_reasons", [])
            reasons.append("Critical keywords detected: " + ", ".join(kw_list))
            result["human_review_reasons"] = reasons

        result["critical_keywords_found"] = kw_list

        return result

    # -----------------------------------------------------------------------
    # Challenge / dispute system
    # -----------------------------------------------------------------------

    @gl.public.write
    def challenge_decision(self, note_hash: str, reason: str, evidence: str) -> None:
        caller = str(gl.message.sender_address)
        assert note_hash in self.assessments, "No assessment found"

        note_data = json.loads(self.notes[note_hash])
        assert note_data["status"] in ("consensus_reached", "human_review", "finalized"), "Not challengeable"

        ts = str(gl.message_raw["datetime"])

        self.challenge_counter = u32(int(self.challenge_counter) + 1)
        challenge_id = "challenge_" + str(int(self.challenge_counter))

        assessment_data = json.loads(self.assessments[note_hash])

        self.challenges[challenge_id] = json.dumps({
            "challenge_id": challenge_id,
            "note_hash": note_hash,
            "challenger": caller,
            "reason": reason,
            "evidence": evidence,
            "status": "open",
            "original_category": assessment_data["category"],
            "proposed_category": "",
            "resolution": "",
            "created_at": ts,
            "resolved_at": "",
        })

        note_data["status"] = "challenged"
        self.notes[note_hash] = json.dumps(note_data)

        self.audit_log.append(json.dumps({
            "event_type": "decision_challenged",
            "note_hash": note_hash,
            "actor": caller,
            "details": json.dumps({"challenge_id": challenge_id, "reason": reason}),
            "timestamp": ts,
        }))

    @gl.public.write
    def resolve_challenge(self, challenge_id: str, resolution: str) -> None:
        caller = str(gl.message.sender_address)
        caller_role = self.roles.get(caller, "")
        assert caller_role in ("reviewer", "admin"), "Not authorized"
        assert challenge_id in self.challenges, "Challenge not found"

        challenge_data = json.loads(self.challenges[challenge_id])
        assert challenge_data["status"] == "open", "Already resolved"

        note_hash = challenge_data["note_hash"]
        assessment_data = json.loads(self.assessments[note_hash])
        note_data = json.loads(self.notes[note_hash])

        ts = str(gl.message_raw["datetime"])

        orig_category = assessment_data["category"]
        orig_priority = assessment_data["priority_score"]
        orig_reasoning = assessment_data["reasoning"]
        challenge_reason = challenge_data["reason"]
        challenge_evidence = challenge_data["evidence"]
        note_text = note_data.get("de_identified_text", "")

        resolve_prompt = (
            "You are a clinical administrative triage reviewer. "
            "Review this challenge to a previous triage decision.\n\n"
            "ORIGINAL ASSESSMENT:\n"
            "- Category: " + str(orig_category) + "\n"
            "- Priority: " + str(orig_priority) + "\n"
            "- Reasoning: " + str(orig_reasoning) + "\n\n"
            "CHALLENGE:\n"
            "- Reason: " + str(challenge_reason) + "\n"
            "- Evidence: " + str(challenge_evidence) + "\n\n"
            "REVIEWER RESOLUTION: " + resolution + "\n\n"
            "DE-IDENTIFIED NOTE:\n" + str(note_text) + "\n\n"
            "Should the original category be upheld or changed? "
            "Respond with ONLY valid JSON:\n"
            '{"upheld": true or false, '
            '"new_category": "<emergency|urgent|same_day|routine|administrative>", '
            '"explanation": "<brief explanation>"}\n\n'
            "NEVER diagnose. NEVER recommend treatment."
        )

        def nondet():
            res = gl.nondet.exec_prompt(resolve_prompt, response_format="json")
            if isinstance(res, dict):
                parsed = res
            else:
                res = str(res).replace("```json", "").replace("```", "").strip()
                parsed = json.loads(res)
            valid_cats = ["emergency", "urgent", "same_day", "routine", "administrative"]
            assert isinstance(parsed.get("upheld"), bool)
            assert parsed.get("new_category") in valid_cats
            return json.dumps(parsed, sort_keys=True)

        resolve_comparison = (
            "Compare these two challenge resolution outputs. "
            "They are equivalent if they agree on 'upheld' (both true or both false) "
            "AND assign the same 'new_category'. "
            "Answer ONLY 'True' if equivalent or 'False' if not."
        )

        result_str = gl.eq_principle.prompt_comparative(nondet, resolve_comparison)
        result = json.loads(result_str)

        if result["upheld"]:
            challenge_data["status"] = "rejected"
            challenge_data["resolution"] = result["explanation"]
            note_data["status"] = "finalized"
        else:
            challenge_data["status"] = "resolved"
            challenge_data["proposed_category"] = result["new_category"]
            challenge_data["resolution"] = result["explanation"]
            assessment_data["category"] = result["new_category"]
            note_data["status"] = "resolved"
            self.assessments[note_hash] = json.dumps(assessment_data)

        challenge_data["resolved_at"] = ts
        self.challenges[challenge_id] = json.dumps(challenge_data)
        self.notes[note_hash] = json.dumps(note_data)

        self.audit_log.append(json.dumps({
            "event_type": "challenge_resolved",
            "note_hash": note_hash,
            "actor": caller,
            "details": json.dumps({
                "challenge_id": challenge_id,
                "upheld": result["upheld"],
                "new_category": result.get("new_category", ""),
            }),
            "timestamp": ts,
        }))

    # -----------------------------------------------------------------------
    # Protocol management
    # -----------------------------------------------------------------------

    @gl.public.write
    def update_protocol(self, version: str, description: str) -> None:
        caller = str(gl.message.sender_address)
        assert self.roles.get(caller, "") == "admin", "Only admin"
        old_version = self.protocol_version
        self.protocol_version = version
        ts = str(gl.message_raw["datetime"])
        self.audit_log.append(json.dumps({
            "event_type": "protocol_updated",
            "note_hash": "",
            "actor": caller,
            "details": json.dumps({
                "old_version": old_version,
                "new_version": version,
                "description": description,
            }),
            "timestamp": ts,
        }))

    # -----------------------------------------------------------------------
    # Human review finalization
    # -----------------------------------------------------------------------

    @gl.public.write
    def finalize_review(self, note_hash: str, final_category: str) -> None:
        caller = str(gl.message.sender_address)
        caller_role = self.roles.get(caller, "")
        assert caller_role in ("reviewer", "admin"), "Not authorized"
        assert note_hash in self.notes, "Note not found"

        note_data = json.loads(self.notes[note_hash])
        assert note_data["status"] == "human_review", "Not in human review"

        valid_categories = ["emergency", "urgent", "same_day", "routine", "administrative"]
        assert final_category in valid_categories, "Invalid category"

        assessment_data = json.loads(self.assessments[note_hash])
        assessment_data["category"] = final_category
        self.assessments[note_hash] = json.dumps(assessment_data)

        note_data["status"] = "finalized"
        self.notes[note_hash] = json.dumps(note_data)

        ts = str(gl.message_raw["datetime"])
        self.audit_log.append(json.dumps({
            "event_type": "review_finalized",
            "note_hash": note_hash,
            "actor": caller,
            "details": json.dumps({"final_category": final_category}),
            "timestamp": ts,
        }))

    # -----------------------------------------------------------------------
    # View methods
    # -----------------------------------------------------------------------

    @gl.public.view
    def get_assessment(self, note_hash: str) -> str:
        if note_hash not in self.assessments:
            return '{"error": "Assessment not found"}'
        return self.assessments[note_hash]

    @gl.public.view
    def get_note(self, note_hash: str) -> str:
        if note_hash not in self.notes:
            return '{"error": "Note not found"}'
        return self.notes[note_hash]

    @gl.public.view
    def get_challenge(self, challenge_id: str) -> str:
        if challenge_id not in self.challenges:
            return '{"error": "Challenge not found"}'
        return self.challenges[challenge_id]

    @gl.public.view
    def get_role(self, address: str) -> str:
        return self.roles.get(address, "")

    @gl.public.view
    def get_protocol_version(self) -> str:
        return self.protocol_version

    @gl.public.view
    def get_audit_log_length(self) -> u32:
        return u32(len(self.audit_log))
