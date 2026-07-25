# v.0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import genlayer as gl
import genlayer.gl as glm
import json


class Clario(glm.Contract):
    owner: str
    protocol_version: str

    hospitals: gl.TreeMap[str, str]
    hospital_count: gl.u64
    hospital_list: gl.TreeMap[gl.u64, str]

    staff: gl.TreeMap[str, str]
    staff_count: gl.u64
    staff_list: gl.TreeMap[gl.u64, str]

    roles: gl.TreeMap[str, str]

    cases: gl.TreeMap[str, str]
    case_count: gl.u64
    case_list: gl.TreeMap[gl.u64, str]

    challenges: gl.TreeMap[str, str]
    challenge_count: gl.u64
    challenge_list: gl.TreeMap[gl.u64, str]

    manual_reviews: gl.TreeMap[str, str]

    audit_log: gl.TreeMap[gl.u64, str]
    audit_count: gl.u64

    def __init__(self) -> None:
        self.owner = str(glm.message.sender_address)
        self.protocol_version = "2.0.0"
        self.case_count = gl.u64(0)
        self.challenge_count = gl.u64(0)
        self.hospital_count = gl.u64(0)
        self.staff_count = gl.u64(0)
        self.audit_count = gl.u64(0)
        self.roles[self.owner] = "hospital_admin"
        self._log("contract_deployed", "", self.owner, "{}")

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _log(self, event_type: str, entity_id: str, actor: str, data: str) -> None:
        idx = self.audit_count
        entry = json.dumps({
            "event_type": event_type,
            "entity_id": entity_id,
            "actor": actor,
            "data": data,
            "timestamp": "",
        })
        self.audit_log[idx] = entry
        self.audit_count = gl.u64(int(self.audit_count) + 1)

    def _sender(self) -> str:
        return str(glm.message.sender_address)

    def _role(self, addr: str) -> str:
        r = self.roles.get(addr)
        return r if r is not None else ""

    # ── Hospital management ────────────────────────────────────────────────────

    @glm.public.write
    def register_hospital(self, name: str) -> None:
        sender = self._sender()
        assert sender == self.owner, "only owner"
        assert name, "name required"
        assert self.hospitals.get(sender) is None, "already registered"
        hospital = json.dumps({"name": name, "admin": sender, "active": True})
        self.hospitals[sender] = hospital
        idx = self.hospital_count
        self.hospital_list[idx] = sender
        self.hospital_count = gl.u64(int(self.hospital_count) + 1)
        self._log("hospital_registered", sender, sender, json.dumps({"name": name}))

    @glm.public.view
    def get_hospital(self, address: str) -> str:
        h = self.hospitals.get(address)
        return h if h is not None else ""

    # ── Staff management ───────────────────────────────────────────────────────

    @glm.public.write
    def register_staff(self, address: str, role: str) -> None:
        sender = self._sender()
        assert self._role(sender) in ("hospital_admin", "owner"), "unauthorized"
        valid_roles = ("clinician", "reviewer", "auditor", "hospital_admin")
        assert role in valid_roles, "invalid role"
        member = json.dumps({"address": address, "role": role, "registered_by": sender})
        self.staff[address] = member
        self.roles[address] = role
        idx = self.staff_count
        self.staff_list[idx] = address
        self.staff_count = gl.u64(int(self.staff_count) + 1)
        self._log("staff_registered", address, sender, json.dumps({"role": role}))

    @glm.public.view
    def get_staff(self, address: str) -> str:
        s = self.staff.get(address)
        return s if s is not None else ""

    # ── Role management ────────────────────────────────────────────────────────

    @glm.public.write
    def grant_role(self, address: str, role: str, hospital: str) -> None:
        sender = self._sender()
        assert self._role(sender) in ("hospital_admin", "owner"), "unauthorized"
        self.roles[address] = role
        self._log("role_granted", address, sender, json.dumps({"role": role, "hospital": hospital}))

    @glm.public.write
    def revoke_role(self, address: str) -> None:
        sender = self._sender()
        assert self._role(sender) in ("hospital_admin", "owner"), "unauthorized"
        if self.roles.get(address) is not None:
            del self.roles[address]
        self._log("role_revoked", address, sender, "{}")

    @glm.public.view
    def get_role(self, address: str) -> str:
        return self._role(address)

    # ── Case submission ────────────────────────────────────────────────────────

    @glm.public.write
    def submit_case(self, sanitized_text: str, text_hash: str, note_type: str, department: str) -> None:
        sender = self._sender()
        assert self._role(sender) in ("clinician", "hospital_admin", "owner"), "unauthorized"
        assert sanitized_text, "text required"
        assert text_hash, "hash required"

        case_id = f"case_{int(self.case_count)}"

        prompt = f"""You are an administrative triage system for clinical notes. You do NOT diagnose patients or recommend treatment. Your task is administrative routing only.

Analyze the following clinical note and determine administrative priority:

Note type: {note_type}
Department: {department}
Sanitized text (PHI removed): {sanitized_text}

Classify this note for administrative routing. Respond ONLY in this exact JSON format:
{{
  "category": "Emergency|Urgent|Same-Day|Routine|Administrative",
  "priority": <integer 1-100>,
  "routing_recommendation": "<administrative routing action>",
  "critical_keywords_found": ["<keyword1>", "<keyword2>"],
  "reasoning": "<brief administrative reasoning>"
}}

Rules:
- Emergency (priority 85-100): life-threatening indicators requiring immediate routing
- Urgent (priority 60-84): time-sensitive but not immediately life-threatening
- Same-Day (priority 40-59): needs attention today
- Routine (priority 15-39): standard scheduling
- Administrative (priority 1-14): billing, documentation, admin tasks only
- Do NOT make clinical diagnoses
- Do NOT recommend specific treatments or medications"""

        def get_assessment():
            result = glm.nondet.exec_prompt(prompt)
            result = result.replace("```json", "").replace("```", "").strip()
            return result

        assessment_json = glm.eq_principle.prompt_comparative(
            get_assessment,
            "The category and priority level must match within 15 points. Routing recommendation must address the same urgency level."
        )

        try:
            assessment = json.loads(assessment_json)
        except Exception:
            assessment = {
                "category": "Routine",
                "priority": 20,
                "routing_recommendation": "Standard processing",
                "critical_keywords_found": [],
                "reasoning": "Could not parse AI response",
            }

        case = json.dumps({
            "case_id": case_id,
            "submitter": sender,
            "sanitized_text": sanitized_text,
            "text_hash": text_hash,
            "note_type": note_type,
            "department": department,
            "status": "consensus_complete",
            "category": assessment.get("category", "Routine"),
            "priority": assessment.get("priority", 20),
            "routing_recommendation": assessment.get("routing_recommendation", ""),
            "critical_keywords_found": assessment.get("critical_keywords_found", []),
            "reasoning": assessment.get("reasoning", ""),
            "timestamp": "",
        })
        self.cases[case_id] = case
        idx = self.case_count
        self.case_list[idx] = case_id
        self.case_count = gl.u64(int(self.case_count) + 1)
        self._log("case_submitted", case_id, sender, json.dumps({
            "category": assessment.get("category"),
            "priority": assessment.get("priority"),
        }))

    # ── Case queries ──────────────────────────────────────────────────────────

    @glm.public.view
    def get_case(self, case_id: str) -> str:
        c = self.cases.get(case_id)
        return c if c is not None else ""

    @glm.public.view
    def list_cases(self) -> str:
        result = []
        count = int(self.case_count)
        for i in range(count):
            cid = self.case_list.get(gl.u64(i))
            if cid is not None:
                c = self.cases.get(cid)
                if c is not None:
                    result.append(json.loads(c))
        return json.dumps(result)

    @glm.public.view
    def list_cases_by_status(self, status: str) -> str:
        result = []
        count = int(self.case_count)
        for i in range(count):
            cid = self.case_list.get(gl.u64(i))
            if cid is not None:
                c = self.cases.get(cid)
                if c is not None:
                    case = json.loads(c)
                    if case.get("status") == status:
                        result.append(case)
        return json.dumps(result)

    # ── Manual review ─────────────────────────────────────────────────────────

    @glm.public.write
    def request_manual_review(self, case_id: str) -> None:
        sender = self._sender()
        c = self.cases.get(case_id)
        assert c is not None, "case not found"
        case = json.loads(c)
        assert case.get("submitter") == sender or self._role(sender) in ("hospital_admin", "owner"), "unauthorized"
        case["status"] = "manual_review_requested"
        self.cases[case_id] = json.dumps(case)
        self._log("manual_review_requested", case_id, sender, "{}")

    @glm.public.write
    def submit_manual_review(self, case_id: str, decision: str) -> None:
        sender = self._sender()
        assert self._role(sender) in ("reviewer", "hospital_admin", "owner"), "unauthorized"
        c = self.cases.get(case_id)
        assert c is not None, "case not found"
        case = json.loads(c)
        review = json.dumps({"case_id": case_id, "reviewer": sender, "decision": decision, "timestamp": ""})
        self.manual_reviews[case_id] = review
        case["status"] = "reviewed"
        case["manual_review"] = decision
        self.cases[case_id] = json.dumps(case)
        self._log("manual_review_submitted", case_id, sender, json.dumps({"decision": decision}))

    # ── Challenges ────────────────────────────────────────────────────────────

    @glm.public.write
    def challenge_decision(self, case_id: str, reason: str) -> None:
        sender = self._sender()
        c = self.cases.get(case_id)
        assert c is not None, "case not found"
        case = json.loads(c)
        assert case.get("submitter") == sender or self._role(sender) in ("hospital_admin", "owner"), "unauthorized"

        challenge_id = f"challenge_{int(self.challenge_count)}"

        prompt = f"""You are re-evaluating an administrative triage decision that has been challenged.

Original assessment: category={case.get('category')}, priority={case.get('priority')}
Challenge reason: {reason}

Re-assess administrative routing. Respond ONLY in this exact JSON format:
{{
  "category": "Emergency|Urgent|Same-Day|Routine|Administrative",
  "priority": <integer 1-100>,
  "routing_recommendation": "<administrative routing action>",
  "challenge_outcome": "upheld|overturned",
  "reasoning": "<brief explanation of re-evaluation>"
}}"""

        def get_challenge_assessment():
            result = glm.nondet.exec_prompt(prompt)
            result = result.replace("```json", "").replace("```", "").strip()
            return result

        reassessment_json = glm.eq_principle.prompt_comparative(
            get_challenge_assessment,
            "The category and challenge outcome must match. Priority within 15 points."
        )

        try:
            reassessment = json.loads(reassessment_json)
        except Exception:
            reassessment = {
                "category": case.get("category", "Routine"),
                "priority": case.get("priority", 20),
                "routing_recommendation": case.get("routing_recommendation", ""),
                "challenge_outcome": "upheld",
                "reasoning": "Could not parse re-evaluation",
            }

        challenge = json.dumps({
            "challenge_id": challenge_id,
            "case_id": case_id,
            "challenger": sender,
            "reason": reason,
            "reassessment": reassessment,
            "status": "resolved",
            "timestamp": "",
        })
        self.challenges[challenge_id] = challenge
        idx = self.challenge_count
        self.challenge_list[idx] = challenge_id
        self.challenge_count = gl.u64(int(self.challenge_count) + 1)

        if reassessment.get("challenge_outcome") == "overturned":
            case["category"] = reassessment.get("category", case.get("category"))
            case["priority"] = reassessment.get("priority", case.get("priority"))
            case["routing_recommendation"] = reassessment.get("routing_recommendation", case.get("routing_recommendation"))
            case["reasoning"] = reassessment.get("reasoning", case.get("reasoning"))
            case["status"] = "challenge_overturned"
        else:
            case["status"] = "challenge_upheld"

        self.cases[case_id] = json.dumps(case)
        self._log("challenge_resolved", challenge_id, sender, json.dumps({
            "case_id": case_id,
            "outcome": reassessment.get("challenge_outcome"),
        }))

    @glm.public.view
    def list_challenges(self) -> str:
        result = []
        count = int(self.challenge_count)
        for i in range(count):
            chid = self.challenge_list.get(gl.u64(i))
            if chid is not None:
                ch = self.challenges.get(chid)
                if ch is not None:
                    result.append(json.loads(ch))
        return json.dumps(result)

    @glm.public.view
    def list_challenges_by_case(self, case_id: str) -> str:
        result = []
        count = int(self.challenge_count)
        for i in range(count):
            chid = self.challenge_list.get(gl.u64(i))
            if chid is not None:
                ch = self.challenges.get(chid)
                if ch is not None:
                    challenge = json.loads(ch)
                    if challenge.get("case_id") == case_id:
                        result.append(challenge)
        return json.dumps(result)

    # ── Finalization ──────────────────────────────────────────────────────────

    @glm.public.write
    def finalize_case(self, case_id: str) -> None:
        sender = self._sender()
        assert self._role(sender) in ("hospital_admin", "owner"), "unauthorized"
        c = self.cases.get(case_id)
        assert c is not None, "case not found"
        case = json.loads(c)
        case["status"] = "finalized"
        case["finalized_by"] = sender
        self.cases[case_id] = json.dumps(case)
        self._log("case_finalized", case_id, sender, "{}")

    @glm.public.write
    def archive_case(self, case_id: str) -> None:
        sender = self._sender()
        assert self._role(sender) in ("hospital_admin", "owner"), "unauthorized"
        c = self.cases.get(case_id)
        assert c is not None, "case not found"
        case = json.loads(c)
        assert case.get("status") == "finalized", "must be finalized first"
        case["status"] = "archived"
        self.cases[case_id] = json.dumps(case)
        self._log("case_archived", case_id, sender, "{}")

    # ── Audit ─────────────────────────────────────────────────────────────────

    @glm.public.view
    def audit_history(self) -> str:
        result = []
        count = int(self.audit_count)
        for i in range(count):
            entry = self.audit_log.get(gl.u64(i))
            if entry is not None:
                result.append(json.loads(entry))
        return json.dumps(result)

    @glm.public.view
    def audit_history_by_case(self, case_id: str) -> str:
        result = []
        count = int(self.audit_count)
        for i in range(count):
            entry = self.audit_log.get(gl.u64(i))
            if entry is not None:
                e = json.loads(entry)
                if e.get("entity_id") == case_id:
                    result.append(e)
        return json.dumps(result)
