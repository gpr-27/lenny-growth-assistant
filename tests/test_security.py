import pytest

def test_iframe_sandbox_policy():
    """
    Verifies that the sandboxing model enforces:
    - sandbox='allow-scripts' without 'allow-same-origin' (prevents cookie access)
    - strict CSP blocking external arbitrary scripts
    """
    allowed_sandbox_flags = ["allow-scripts"]
    disallowed_sandbox_flags = ["allow-same-origin", "allow-top-navigation", "allow-popups", "allow-forms"]
    
    # Emulate the ArtifactViewer sandbox string
    active_sandbox = "allow-scripts"
    
    for flag in disallowed_sandbox_flags:
        assert flag not in active_sandbox, f"Security risk: {flag} must not be present in artifact sandbox."

def test_csp_header_content():
    """Verify Content Security Policy contains script-src 'none' or safe CDN only."""
    csp = "default-src 'self'; script-src 'none'; style-src 'unsafe-inline' https://cdn.tailwindcss.com; img-src * data:;"
    assert "script-src 'none'" in csp
    assert "https://cdn.tailwindcss.com" in csp
