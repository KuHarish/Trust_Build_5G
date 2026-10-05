from typing import Dict, Any, List
from app.security.models.security_policy import SecurityPolicy

VALID_OPERATORS = ["==", "!=", ">", ">=", "<", "<=", "in", "not_in", "MISSING"]
VALID_ACTIONS = ["ALLOW", "MONITOR", "WARN", "RATE_LIMIT", "QUARANTINE", "BLOCK"]
VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

class PolicyValidator:
    @staticmethod
    def validate(policy: SecurityPolicy) -> Dict[str, Any]:
        errors = []
        
        # 1. Validate Thresholds
        if not (0 <= policy.thresholds.mlHighConfidence <= 1):
            errors.append({"field": "thresholds.mlHighConfidence", "message": "Must be between 0 and 1"})
        if not (0 <= policy.thresholds.mlLowConfidence <= 1):
            errors.append({"field": "thresholds.mlLowConfidence", "message": "Must be between 0 and 1"})
        if policy.thresholds.mlLowConfidence > policy.thresholds.mlHighConfidence:
            errors.append({"field": "thresholds.mlLowConfidence", "message": "Low confidence cannot exceed high confidence"})
            
        # 2. Validate Fallback Behavior
        if policy.fallbackBehavior not in VALID_ACTIONS:
            errors.append({"field": "fallbackBehavior", "message": f"Invalid fallback action. Allowed: {VALID_ACTIONS}"})
            
        # 3. Validate Rules
        rule_ids = set()
        for i, rule in enumerate(policy.rules):
            if rule.ruleId in rule_ids:
                errors.append({"field": f"rules[{i}].ruleId", "message": "Duplicate rule ID"})
            rule_ids.add(rule.ruleId)
            
            if rule.decisionAction not in VALID_ACTIONS:
                errors.append({"field": f"rules[{i}].decisionAction", "message": f"Invalid action: {rule.decisionAction}"})
            
            if rule.severity not in VALID_SEVERITIES:
                errors.append({"field": f"rules[{i}].severity", "message": f"Invalid severity: {rule.severity}"})
                
            for j, cond in enumerate(rule.conditions):
                if cond.operator not in VALID_OPERATORS:
                    errors.append({"field": f"rules[{i}].conditions[{j}].operator", "message": f"Invalid operator: {cond.operator}"})

        # 4. Detect Contradictory Rules (Basic exact match check)
        # Group rules by their exact conditions (stringified)
        condition_map = {}
        for rule in policy.rules:
            # Sort conditions by field to ensure stable key
            sorted_conds = sorted(rule.conditions, key=lambda c: c.field)
            cond_key = str([f"{c.field}{c.operator}{c.value}" for c in sorted_conds])
            
            if cond_key not in condition_map:
                condition_map[cond_key] = []
            condition_map[cond_key].append(rule)
            
        for cond_key, matching_rules in condition_map.items():
            if len(matching_rules) > 1:
                actions = set(r.decisionAction for r in matching_rules)
                if len(actions) > 1:
                    errors.append({
                        "field": "rules", 
                        "message": f"Contradictory rules detected. Rules {', '.join(r.name for r in matching_rules)} have identical conditions but different actions: {actions}"
                    })

        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

policy_validator = PolicyValidator()
