# v0.3.0
# { "Depends": "py-genlayer:9b8kjyda2ycxyq4ea6g4yfpnydxhd52gqba5rb8dw7krkh5mn9p0" }

import genlayer as gl
from genlayer.types import *
import json

# ---------------------------------------------------------------------------
# Clario — Decentralized Clinical Note Triage
#
# GenLayer Intelligent Contract — sole backend for Clario.
# Privacy: NO PHI stored. Only sanitized text, hashes, classifications,
# and audit metadata. Browser-side redaction strips PII before submission.
#
# This contract NEVER diagnoses patients or recommends treatment.
# It only assists administrative workflow prioritization.
# ---------------------------------------------------------------------------

STATUS_DRAFT = "draft"
STATUS_SUBMITTED = "submitted"
STATUS_PENDING_CONSENSUS = "pending_consensus"
STATUS_CONSENSUS_COMPLETE = "consensus_complete"
STATUS_MANUAL_REVIEW = "manual_review"
STATUS_CHALLENGED = "challenged"
STATUS_FINALIZED = "finalized"
STATUS_ARCHIVED = "archived"

ROLE_HOSPITAL_ADMIN = "hospital_admin"
ROLE_CLINICIAN = "clinician"
ROLE_REVIEWER = "reviewer"
ROLE_AUDITOR = "auditor"

VALID_ROLES = [ROLE_HOSPITAL_ADMIN, ROLE_CLINICIAN, ROLE_REVIEWER, ROLE_AUDITOR]
VALID_CATEGORIES = ["emergency", "urgent", "same_day", "routine", "administrative"]

CRITICAL_KEYWORDS = [
    "chest pain", "severe bleeding", "stroke symptoms",
    "suicidal thoughts", "breathing difficulties", "loss of consciousness",
    "cardiac arrest", "anaphylaxis", "seizure", "unconscious",
]


class Clario(gl.contract.Contract):
    owner: str
    hospitals: TreeMap[str, str]
    hospital_list: DynArray[str]
    staff: TreeMap[str, str]
    staff_list: DynArray[str]
    roles: TreeMap[str, str]
    cases: TreeMap[str, str]
    case_ids: DynArray[str]
    case_counter: u64
    challenges: TreeMap[str, str]
    challenge_ids: DynArray[str]
    challenge_counter: u64
    manual_reviews: TreeMap[str, str]
    audit_log: DynArray[str]
    protocol_version: str

    def __init__(self) -> None:
        self.owner = gl.message.sender_address.as_hex
        self.protocol_version = "2.0.0"
        self.case_counter = u64(0)
        self.challenge_counter = u64(0)
        self.roles[self.owner] = ROLE_HOSPITAL_ADMIN
        self._log_audit("contract_deployed", "", self.owner, {"protocol_version": "2.0.0"})

    # -----------------------------------------------------------------------
    # Hospital Registration
    # -----------------------------------------------------------------------

    @gl.public.write
    def register_hospital(self, name: str, identifier: str) -> None:
        caller = gl.message.sender_address.as_hex
        ts = self._timestamp()
        self.hospitals[caller] = json.dumps({
            "address": caller,
            "name": name,
            "identifier": identifier,
            "registered_at": ts,
            "active": True,
        })
        self.hospital_list.append(caller)
        if self.roles.get(caller, "") == "":
            self.roles[caller] = ROLE_HOSPITAL_ADMIN
        self._log_audit("hospital_registered", "", caller, {"name": name, "identifier": identifier})

    # -----------------------------------------------------------------------
    # Staff Registration & Role Management
    # -----------------------------------------------------------------------

    @gl.public.write
    def register_staff(self, name: str, department: str) -> None:
        caller = gl.message.sender_address.as_hex
        ts = self._timestamp()
        self.staff[caller] = json.dumps({
            "address": caller,
            "name": name,
            "department": department,
            "registered_at": ts,
            "active": True,
        })
        self.staff_list.append(caller)
        if self.roles.get(caller, "") == "":
            self.roles[caller] = ROLE_CLINICIAN
        self._log_audit("staff_registered", "", caller, {"name": name, "department": department})

    @gl.public.write
    def grant_role(self, address: str, role: str) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role != ROLE_HOSPITAL_ADMIN and caller != self.owner:
            raise gl.vm.UserError("Only hospital_admin can grant roles")
        if role not in VALID_ROLES:
            raise gl.vm.UserError("Invalid role: " + role)
        self.roles[address] = role
        self._log_audit("role_granted", "", caller, {"target": address, "role": role})

    @gl.public.write
    def revoke_role(self, address: str) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role != ROLE_HOSPITAL_ADMIN and caller != self.owner:
            raise gl.vm.UserError("Only hospital_admin can revoke roles")
        if address == self.owner:
            raise gl.vm.UserError("Cannot revoke owner role")
        old_role = self.roles.get(address, "")
        self.roles[address] = ""
        self._log_audit("role_revoked", "", caller, {"target": address, "previous_role": old_role})

    # -----------------------------------------------------------------------
    # Case Submission & AI Triage
    # -----------------------------------------------------------------------

    @gl.public.write
    def submit_case(
        self,
        note_hash: str,
        sanitized_text: str,
        department: str,
        note_type: str,
    ) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role not in (ROLE_CLINICIAN, ROLE_HOSPITAL_ADMIN, ROLE_REVIEWER):
            raise gl.vm.UserError("Not authorized to submit cases")

        ts = self._timestamp()
        self.case_counter = u64(int(self.case_counter) + 1)
        case_id = "CASE-" + str(int(self.case_counter)).zfill(6)

        case_data = {
            "case_id": case_id,
            "note_hash": note_hash,
            "sanitized_text": sanitized_text,
            "department": department,
            "note_type": note_type,
            "submitter": caller,
            "status": STATUS_SUBMITTED,
            "priority": "",
            "category": "",
            "confidence": 0,
            "reasoning": "",
            "missing_info": "[]",
            "routing_recommendation": "",
            "human_review_required": False,
            "human_review_reasons": "[]",
            "critical_keywords_found": "[]",
            "validator_agreement": "",
            "appealable": True,
            "created_at": ts,
            "triage_started_at": "",
            "triage_completed_at": "",
            "manual_review_requested_at": "",
            "manual_review_completed_at": "",
            "challenge_created_at": "",
            "challenge_resolved_at": "",
            "finalized_at": "",
            "archived_at": "",
        }

        self.cases[case_id] = json.dumps(case_data)
        self.case_ids.append(case_id)
        self._log_audit("case_submitted", case_id, caller, {
            "note_hash": note_hash,
            "department": department,
            "note_type": note_type,
        })

        self._run_triage(case_id, sanitized_text, ts)

    def _run_triage(self, case_id: str, text: str, ts: str) -> None:
        case_data = json.loads(self.cases[case_id])
        case_data["status"] = STATUS_PENDING_CONSENSUS
        case_data["triage_started_at"] = ts
        self.cases[case_id] = json.dumps(case_data)

        text_lower = text.lower()
        found_keywords = [kw for kw in CRITICAL_KEYWORDS if kw in text_lower]
        force_human_review = len(found_keywords) > 0

        prompt = (
            "You are a clinical administrative triage assistant. "
            "You prioritize clinical notes for administrative routing only. "
            "You NEVER diagnose patients. You NEVER recommend treatment.\n\n"
            "Analyze this de-identified clinical note and provide an "
            "administrative triage assessment.\n\n"
            "NOTE:\n" + text + "\n\n"
            "Respond with ONLY valid JSON, no markdown:\n"
            '{"category":"<emergency|urgent|same_day|routine|administrative>",'
            '"priority_score":<integer 1-100>,'
            '"confidence":<integer 1-100>,'
            '"reasoning":"<brief explanation of category choice>",'
            '"missing_info":["<list of missing items if any>"],'
            '"routing_recommendation":"<where to route this note>",'
            '"human_review_required":<true or false>,'
            '"human_review_reasons":["<reasons if review needed>"]}\n\n'
            "Scoring guide:\n"
            "- Emergency (80-100): life-threatening symptoms needing immediate admin action\n"
            "- Urgent (60-79): worsening or moderate severity\n"
            "- Same-Day (40-59): persistent issues needing same-day attention\n"
            "- Routine (20-39): standard follow-ups, refills, stable conditions\n"
            "- Administrative (1-19): scheduling, billing, records requests\n"
            "- Set human_review_required=true if confidence < 85 or ambiguous"
        )

        kw_list = found_keywords
        needs_review = force_human_review

        def nondet():
            res = gl.nondet.exec_prompt(prompt)
            if isinstance(res, dict):
                parsed = res
            else:
                cleaned = str(res).replace("```json", "").replace("```", "").strip()
                parsed = json.loads(cleaned)
            cat = parsed.get("category", "")
            if cat not in VALID_CATEGORIES:
                raise gl.vm.UserError("Invalid category: " + cat)
            ps = parsed.get("priority_score", 0)
            if not (isinstance(ps, int) and 1 <= ps <= 100):
                raise gl.vm.UserError("priority_score out of range")
            conf = parsed.get("confidence", 0)
            if not (isinstance(conf, int) and 1 <= conf <= 100):
                raise gl.vm.UserError("confidence out of range")
            return json.dumps(parsed, sort_keys=True)

        comparison_prompt = (
            "Compare these two clinical triage assessments. "
            "They are equivalent if they assign the same category AND "
            "priority scores are within 15 points of each other. "
            "Minor wording differences in reasoning are acceptable. "
            "Answer ONLY 'True' if equivalent, 'False' if not."
        )

        result_str = gl.eq_principle.prompt_comparative(nondet, comparison_prompt)
        result = json.loads(result_str)

        if needs_review:
            result["human_review_required"] = True
            reasons = result.get("human_review_reasons", [])
            if not isinstance(reasons, list):
                reasons = []
            reasons.append("Critical keywords detected: " + ", ".join(kw_list))
            result["human_review_reasons"] = reasons

        result["critical_keywords_found"] = kw_list

        status = STATUS_MANUAL_REVIEW if result.get("human_review_required") else STATUS_CONSENSUS_COMPLETE

        case_data = json.loads(self.cases[case_id])
        case_data["status"] = status
        case_data["category"] = result.get("category", "")
        case_data["priority"] = str(result.get("priority_score", 0))
        case_data["confidence"] = result.get("confidence", 0)
        case_data["reasoning"] = result.get("reasoning", "")
        case_data["missing_info"] = json.dumps(result.get("missing_info", []))
        case_data["routing_recommendation"] = result.get("routing_recommendation", "")
        case_data["human_review_required"] = result.get("human_review_required", False)
        case_data["human_review_reasons"] = json.dumps(result.get("human_review_reasons", []))
        case_data["critical_keywords_found"] = json.dumps(kw_list)
        case_data["validator_agreement"] = "consensus"
        case_data["triage_completed_at"] = ts
        if status == STATUS_MANUAL_REVIEW:
            case_data["manual_review_requested_at"] = ts
        self.cases[case_id] = json.dumps(case_data)

        self._log_audit("triage_completed", case_id, "system", {
            "category": result.get("category", ""),
            "priority_score": result.get("priority_score", 0),
            "confidence": result.get("confidence", 0),
            "human_review_required": result.get("human_review_required", False),
            "status": status,
        })

    # -----------------------------------------------------------------------
    # Manual Review
    # -----------------------------------------------------------------------

    @gl.public.write
    def request_manual_review(self, case_id: str, reason: str) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role not in (ROLE_REVIEWER, ROLE_HOSPITAL_ADMIN, ROLE_CLINICIAN):
            raise gl.vm.UserError("Not authorized")
        if self.cases.get(case_id, "") == "":
            raise gl.vm.UserError("Case not found")
        case_data = json.loads(self.cases[case_id])
        if case_data["status"] != STATUS_CONSENSUS_COMPLETE:
            raise gl.vm.UserError("Case must be in consensus_complete status")

        ts = self._timestamp()
        case_data["status"] = STATUS_MANUAL_REVIEW
        case_data["manual_review_requested_at"] = ts
        self.cases[case_id] = json.dumps(case_data)
        self._log_audit("manual_review_requested", case_id, caller, {"reason": reason})

    @gl.public.write
    def submit_manual_review(
        self,
        case_id: str,
        final_category: str,
        review_notes: str,
    ) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role not in (ROLE_REVIEWER, ROLE_HOSPITAL_ADMIN):
            raise gl.vm.UserError("Only reviewers or admins can submit manual reviews")
        if self.cases.get(case_id, "") == "":
            raise gl.vm.UserError("Case not found")
        case_data = json.loads(self.cases[case_id])
        if case_data["status"] != STATUS_MANUAL_REVIEW:
            raise gl.vm.UserError("Case must be in manual_review status")
        if final_category not in VALID_CATEGORIES:
            raise gl.vm.UserError("Invalid category")

        ts = self._timestamp()
        review_key = case_id + "_review"
        self.manual_reviews[review_key] = json.dumps({
            "case_id": case_id,
            "reviewer": caller,
            "original_category": case_data["category"],
            "final_category": final_category,
            "review_notes": review_notes,
            "reviewed_at": ts,
        })

        case_data["category"] = final_category
        case_data["status"] = STATUS_FINALIZED
        case_data["manual_review_completed_at"] = ts
        case_data["finalized_at"] = ts
        self.cases[case_id] = json.dumps(case_data)
        self._log_audit("manual_review_completed", case_id, caller, {
            "original_category": case_data.get("category", ""),
            "final_category": final_category,
        })

    # -----------------------------------------------------------------------
    # Challenge / Dispute
    # -----------------------------------------------------------------------

    @gl.public.write
    def challenge_decision(self, case_id: str, reason: str, evidence: str) -> None:
        caller = gl.message.sender_address.as_hex
        if self.cases.get(case_id, "") == "":
            raise gl.vm.UserError("Case not found")
        case_data = json.loads(self.cases[case_id])
        if case_data["status"] not in (STATUS_CONSENSUS_COMPLETE, STATUS_MANUAL_REVIEW, STATUS_FINALIZED):
            raise gl.vm.UserError("Case not in a challengeable state")

        ts = self._timestamp()
        self.challenge_counter = u64(int(self.challenge_counter) + 1)
        challenge_id = "CHG-" + str(int(self.challenge_counter)).zfill(6)

        self.challenges[challenge_id] = json.dumps({
            "challenge_id": challenge_id,
            "case_id": case_id,
            "challenger": caller,
            "reason": reason,
            "evidence": evidence,
            "original_category": case_data["category"],
            "original_priority": case_data["priority"],
            "status": "open",
            "resolution": "",
            "new_category": "",
            "upheld": False,
            "created_at": ts,
            "resolved_at": "",
        })
        self.challenge_ids.append(challenge_id)

        case_data["status"] = STATUS_CHALLENGED
        case_data["challenge_created_at"] = ts
        self.cases[case_id] = json.dumps(case_data)
        self._log_audit("challenge_created", case_id, caller, {"challenge_id": challenge_id, "reason": reason})

    @gl.public.write
    def resolve_challenge(self, challenge_id: str, resolution_notes: str) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role not in (ROLE_REVIEWER, ROLE_HOSPITAL_ADMIN):
            raise gl.vm.UserError("Only reviewers or admins can resolve challenges")
        if self.challenges.get(challenge_id, "") == "":
            raise gl.vm.UserError("Challenge not found")

        challenge = json.loads(self.challenges[challenge_id])
        if challenge["status"] != "open":
            raise gl.vm.UserError("Challenge already resolved")

        case_id = challenge["case_id"]
        case_data = json.loads(self.cases[case_id])
        ts = self._timestamp()

        resolve_prompt = (
            "You are a clinical administrative triage reviewer. "
            "Review this challenge to a previous triage decision.\n\n"
            "ORIGINAL ASSESSMENT:\n"
            "- Category: " + str(challenge["original_category"]) + "\n"
            "- Priority: " + str(challenge["original_priority"]) + "\n"
            "- Reasoning: " + str(case_data.get("reasoning", "")) + "\n\n"
            "CHALLENGE:\n"
            "- Reason: " + str(challenge["reason"]) + "\n"
            "- Evidence: " + str(challenge["evidence"]) + "\n\n"
            "REVIEWER NOTES: " + resolution_notes + "\n\n"
            "DE-IDENTIFIED NOTE:\n" + case_data.get("sanitized_text", "") + "\n\n"
            "Should the original category be upheld or changed? "
            "Respond with ONLY valid JSON, no markdown:\n"
            '{"upheld":true or false,'
            '"new_category":"<emergency|urgent|same_day|routine|administrative>",'
            '"explanation":"<brief explanation>"}\n\n'
            "NEVER diagnose. NEVER recommend treatment."
        )

        def nondet():
            res = gl.nondet.exec_prompt(resolve_prompt)
            if isinstance(res, dict):
                parsed = res
            else:
                cleaned = str(res).replace("```json", "").replace("```", "").strip()
                parsed = json.loads(cleaned)
            if not isinstance(parsed.get("upheld"), bool):
                raise gl.vm.UserError("upheld must be boolean")
            if parsed.get("new_category") not in VALID_CATEGORIES:
                raise gl.vm.UserError("Invalid new_category")
            return json.dumps(parsed, sort_keys=True)

        comparison = (
            "Compare these two challenge resolution outputs. "
            "They are equivalent if they agree on 'upheld' (both true or both false) "
            "AND assign the same 'new_category'. "
            "Answer ONLY 'True' if equivalent, 'False' if not."
        )

        result_str = gl.eq_principle.prompt_comparative(nondet, comparison)
        result = json.loads(result_str)

        if result["upheld"]:
            challenge["status"] = "rejected"
            challenge["resolution"] = result.get("explanation", "")
            challenge["upheld"] = True
            case_data["status"] = STATUS_FINALIZED
            case_data["finalized_at"] = ts
        else:
            challenge["status"] = "accepted"
            challenge["resolution"] = result.get("explanation", "")
            challenge["new_category"] = result["new_category"]
            case_data["category"] = result["new_category"]
            case_data["status"] = STATUS_CONSENSUS_COMPLETE
            case_data["challenge_resolved_at"] = ts

        challenge["resolved_at"] = ts
        self.challenges[challenge_id] = json.dumps(challenge)
        self.cases[case_id] = json.dumps(case_data)
        self._log_audit("challenge_resolved", case_id, caller, {
            "challenge_id": challenge_id,
            "upheld": result["upheld"],
            "new_category": result.get("new_category", ""),
        })

    # -----------------------------------------------------------------------
    # Finalization & Archival
    # -----------------------------------------------------------------------

    @gl.public.write
    def finalize_case(self, case_id: str) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role not in (ROLE_REVIEWER, ROLE_HOSPITAL_ADMIN):
            raise gl.vm.UserError("Only reviewers or admins can finalize")
        if self.cases.get(case_id, "") == "":
            raise gl.vm.UserError("Case not found")
        case_data = json.loads(self.cases[case_id])
        if case_data["status"] != STATUS_CONSENSUS_COMPLETE:
            raise gl.vm.UserError("Case must be in consensus_complete status to finalize")

        ts = self._timestamp()
        case_data["status"] = STATUS_FINALIZED
        case_data["finalized_at"] = ts
        self.cases[case_id] = json.dumps(case_data)
        self._log_audit("case_finalized", case_id, caller, {})

    @gl.public.write
    def archive_case(self, case_id: str) -> None:
        caller = gl.message.sender_address.as_hex
        caller_role = self.roles.get(caller, "")
        if caller_role not in (ROLE_REVIEWER, ROLE_HOSPITAL_ADMIN):
            raise gl.vm.UserError("Only reviewers or admins can archive")
        if self.cases.get(case_id, "") == "":
            raise gl.vm.UserError("Case not found")
        case_data = json.loads(self.cases[case_id])
        if case_data["status"] != STATUS_FINALIZED:
            raise gl.vm.UserError("Case must be finalized before archiving")

        ts = self._timestamp()
        case_data["status"] = STATUS_ARCHIVED
        case_data["archived_at"] = ts
        self.cases[case_id] = json.dumps(case_data)
        self._log_audit("case_archived", case_id, caller, {})

    # -----------------------------------------------------------------------
    # Protocol Management
    # -----------------------------------------------------------------------

    @gl.public.write
    def update_protocol(self, version: str, description: str) -> None:
        caller = gl.message.sender_address.as_hex
        if caller != self.owner:
            raise gl.vm.UserError("Only owner can update protocol")
        old = self.protocol_version
        self.protocol_version = version
        self._log_audit("protocol_updated", "", caller, {
            "old_version": old,
            "new_version": version,
            "description": description,
        })

    # -----------------------------------------------------------------------
    # View Methods
    # -----------------------------------------------------------------------

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        result = self.cases.get(case_id, "")
        if result == "":
            return json.dumps({"error": "Case not found"})
        return result

    @gl.public.view
    def get_role(self, address: str) -> str:
        return self.roles.get(address, "")

    @gl.public.view
    def get_hospital(self, address: str) -> str:
        result = self.hospitals.get(address, "")
        if result == "":
            return json.dumps({"error": "Hospital not found"})
        return result

    @gl.public.view
    def get_staff(self, address: str) -> str:
        result = self.staff.get(address, "")
        if result == "":
            return json.dumps({"error": "Staff not found"})
        return result

    @gl.public.view
    def get_challenge(self, challenge_id: str) -> str:
        result = self.challenges.get(challenge_id, "")
        if result == "":
            return json.dumps({"error": "Challenge not found"})
        return result

    @gl.public.view
    def get_manual_review(self, case_id: str) -> str:
        key = case_id + "_review"
        result = self.manual_reviews.get(key, "")
        if result == "":
            return json.dumps({"error": "Manual review not found"})
        return result

    @gl.public.view
    def get_protocol_version(self) -> str:
        return self.protocol_version

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner

    @gl.public.view
    def list_cases(self) -> str:
        result = []
        for i in range(len(self.case_ids)):
            cid = self.case_ids[i]
            result.append(json.loads(self.cases[cid]))
        return json.dumps(result)

    @gl.public.view
    def list_cases_by_status(self, status: str) -> str:
        result = []
        for i in range(len(self.case_ids)):
            cid = self.case_ids[i]
            c = json.loads(self.cases[cid])
            if c["status"] == status:
                result.append(c)
        return json.dumps(result)

    @gl.public.view
    def list_cases_by_submitter(self, address: str) -> str:
        result = []
        for i in range(len(self.case_ids)):
            cid = self.case_ids[i]
            c = json.loads(self.cases[cid])
            if c["submitter"] == address:
                result.append(c)
        return json.dumps(result)

    @gl.public.view
    def list_challenges(self) -> str:
        result = []
        for i in range(len(self.challenge_ids)):
            chid = self.challenge_ids[i]
            result.append(json.loads(self.challenges[chid]))
        return json.dumps(result)

    @gl.public.view
    def list_challenges_by_case(self, case_id: str) -> str:
        result = []
        for i in range(len(self.challenge_ids)):
            chid = self.challenge_ids[i]
            c = json.loads(self.challenges[chid])
            if c["case_id"] == case_id:
                result.append(c)
        return json.dumps(result)

    @gl.public.view
    def list_hospitals(self) -> str:
        result = []
        for i in range(len(self.hospital_list)):
            addr = self.hospital_list[i]
            result.append(json.loads(self.hospitals[addr]))
        return json.dumps(result)

    @gl.public.view
    def list_staff(self) -> str:
        result = []
        for i in range(len(self.staff_list)):
            addr = self.staff_list[i]
            result.append(json.loads(self.staff[addr]))
        return json.dumps(result)

    @gl.public.view
    def audit_history(self) -> str:
        result = []
        for i in range(len(self.audit_log)):
            result.append(json.loads(self.audit_log[i]))
        return json.dumps(result)

    @gl.public.view
    def audit_history_by_case(self, case_id: str) -> str:
        result = []
        for i in range(len(self.audit_log)):
            entry = json.loads(self.audit_log[i])
            if entry.get("case_id") == case_id:
                result.append(entry)
        return json.dumps(result)

    @gl.public.view
    def case_count(self) -> u64:
        return self.case_counter

    @gl.public.view
    def challenge_count(self) -> u64:
        return self.challenge_counter

    # -----------------------------------------------------------------------
    # Internal Helpers
    # -----------------------------------------------------------------------

    def _timestamp(self) -> str:
        return ""

    def _log_audit(self, event_type: str, case_id: str, actor: str, details: dict) -> None:
        ts = self._timestamp()
        self.audit_log.append(json.dumps({
            "event_type": event_type,
            "case_id": case_id,
            "actor": actor,
            "details": json.dumps(details),
            "timestamp": ts,
        }))
