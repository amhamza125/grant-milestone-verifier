"""Local adversarial harness for the contract's _parse_verdict pure function.

Stubs the genlayer module so GrantMilestoneVerifier.py imports without GenVM,
then runs malformed-verdict inputs through the REAL validation function from
the contract file. Every malformed input must raise ValueError (which the
contract converts to a fail-closed gl.vm.UserError -- no state change, no payout).
"""
import sys
import types

# ---- minimal genlayer stub (just enough for the contract to import) ----
genlayer = types.ModuleType("genlayer")


class _Deco:
    def __call__(self, fn):
        return fn

    def __getattr__(self, item):
        return _Deco()


class _TreeMap(dict):
    def __class_getitem__(cls, item):
        return cls


class _GL:
    public = _Deco()
    evm = types.SimpleNamespace(contract_interface=_Deco())
    vm = types.SimpleNamespace(
        UserError=type("UserError", (Exception,), {})
    )
    Contract = object
    message = types.SimpleNamespace(sender_address="0x0", value=0)
    nondet = _Deco()
    eq_principle = _Deco()

    def __getattr__(self, name):
        if name == "TreeMap":
            return _TreeMap
        return _Deco()


genlayer.gl = _GL()
genlayer.bigint = int
genlayer.u256 = int
genlayer.Address = str
genlayer.TreeMap = _TreeMap
genlayer.__all__ = ["gl", "bigint", "u256", "Address", "TreeMap"]
sys.modules["genlayer"] = genlayer

sys.path.insert(0, "..")
from GrantMilestoneVerifier import _parse_verdict  # noqa: E402

CASES = [
    # (name, input, expected_mid, should_raise)
    ("not_a_dict", "not json at all", 0, True),
    ("missing_met", {"score": 90, "milestone_id": 0}, 0, True),
    ("met_as_string", {"met": "yes", "score": 90, "milestone_id": 0}, 0, True),
    ("met_as_int", {"met": 1, "score": 90, "milestone_id": 0}, 0, True),
    ("score_zero", {"met": True, "score": 0, "milestone_id": 0}, 0, True),
    ("score_101", {"met": True, "score": 101, "milestone_id": 0}, 0, True),
    ("score_string", {"met": True, "score": "95", "milestone_id": 0}, 0, True),
    ("score_bool", {"met": True, "score": True, "milestone_id": 0}, 0, True),
    ("wrong_milestone_id", {"met": True, "score": 85, "milestone_id": 99}, 0, True),
    ("reasons_not_list", {"met": True, "score": 85, "milestone_id": 0, "reasons": "good"}, 0, True),
    ("valid_met", {"met": True, "score": 95, "milestone_id": 0, "reasons": ["deployed", "verified"]}, 0, False),
    ("valid_notmet_noreasons", {"met": False, "score": 42, "milestone_id": 2}, 2, False),
]

passed = 0
for name, payload, mid, should_raise in CASES:
    try:
        out = _parse_verdict(payload, mid)
        ok = not should_raise
        detail = f"-> {out}" if ok else "-> NO ERROR (expected ValueError!)"
    except ValueError as e:
        ok = should_raise
        detail = f"-> ValueError: {e}" if ok else f"-> UNEXPECTED ValueError: {e}"
    except Exception as e:
        ok = False
        detail = f"-> WRONG EXCEPTION {type(e).__name__}: {e}"
    print(f"[{'PASS' if ok else 'FAIL'}] {name} {detail}")
    passed += ok

print(f"DONE: {passed}/{len(CASES)} validation cases passed")
sys.exit(0 if passed == len(CASES) else 1)
