"""
Action Recommendation Engine — Community Action & Response Recommendations.

A standalone, rule-based module that maps risk levels to predefined
recommended actions. Loosely coupled — no dependencies on existing modules.
"""

# ── Predefined action mappings by risk level ──────────────────────

RECOMMENDATIONS = {
    "HIGH": [
        "Boil drinking water",
        "Deploy health workers immediately",
        "Distribute ORS packets",
        "Issue public health warning",
    ],
    "MEDIUM": [
        "Monitor situation closely",
        "Inform local health workers",
        "Encourage safe drinking practices",
    ],
    "LOW": [
        "No immediate action required",
        "Continue monitoring",
    ],
}


def get_recommendations(risk_level: str) -> list[str]:
    """
    Return a list of recommended community actions for the given risk level.

    Parameters
    ----------
    risk_level : str
        One of "HIGH", "MEDIUM", or "LOW" (case-insensitive).

    Returns
    -------
    list[str]
        Ordered list of recommended actions.
    """
    return RECOMMENDATIONS.get(risk_level.upper(), ["Continue monitoring"])
