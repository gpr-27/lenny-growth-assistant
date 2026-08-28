import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from agent import extract_artifacts

def test_extract_html_artifact():
    """Verify regex extraction of HTML codeblocks and title detection."""
    raw_llm_text = """
Here is the growth dashboard you requested:

```html
<!-- title: Growth Loop Dashboard -->
<div class="p-6 bg-slate-900 text-white rounded-2xl shadow-xl">
  <h1 class="text-xl font-bold">Retention Metrics</h1>
  <p>Active Users: 10,000</p>
</div>
```

Let me know if you'd like to change the metric cards.
    """
    cleaned, artifacts = extract_artifacts(raw_llm_text)
    
    assert len(artifacts) == 1
    assert artifacts[0]["type"] == "html"
    assert "Growth Loop Dashboard" in artifacts[0]["title"]
    assert "Active Users" in artifacts[0]["content"]
    assert "```html" not in cleaned

def test_extract_markdown_artifact():
    """Verify extraction of Ship 30 markdown essays."""
    raw_llm_text = """
```markdown
# The 1-Hour Product Retention Framework

### The Hook
Most PMs build features. Top 1% PMs build habits.

- Step 1: Define core value action
- Step 2: Track D1/D7/D30 retention curves
```
    """
    cleaned, artifacts = extract_artifacts(raw_llm_text)
    
    assert len(artifacts) == 1
    assert artifacts[0]["type"] == "markdown"
    assert artifacts[0]["title"] == "The 1-Hour Product Retention Framework"
    assert "Most PMs build features" in artifacts[0]["content"]

def test_no_artifacts_fallback():
    """Verify standard conversational text passes without artifact creation."""
    raw = "According to Brian Chesky, you should do things that don't scale early on."
    cleaned, artifacts = extract_artifacts(raw)
    assert len(artifacts) == 0
    assert cleaned == raw

def test_github_citation_link_generation():
    """Verify exact GitHub markdown URL generation for transcripts."""
    from agent import search_transcripts
    from database import SessionLocal, Transcript
    
    db = SessionLocal()
    try:
        xml, citations = search_transcripts("Claire Hughes Johnson", db)
        assert len(citations) > 0
        claire_cite = next((c for c in citations if "Claire Hughes Johnson" in c["title"]), None)
        assert claire_cite is not None
        assert "github.com/ChatPRD/lennys-podcast-transcripts" in claire_cite["url"]
        assert "claire-hughes-johnson/transcript.md" in claire_cite["url"]
    finally:
        db.close()
