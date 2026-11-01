import base64
import io
import random
from pathlib import Path

import streamlit as st
from PIL import Image, ImageDraw, ImageFont

import auth

# =====================================================================
# 1. PAGE SETUP  (runs for everyone, including the login page)
# =====================================================================
st.set_page_config(
    page_title="DefectX AI",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)
st.session_state.setdefault("messages", [])

DEFECT_COLORS = {
    "Scratch": "#E8590C",
    "Dent": "#6741D9",
    "Crack": "#C92A2A",
    "Rust": "#9C5A1A",
    "Broken": "#0000AD",
}


def color_of(label):
    return DEFECT_COLORS.get(label, "#0B7285")


# ---------- Global styling ----------
st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap');
html, body, [class*="css"], .stApp { font-family: 'Schibsted Grotesk', sans-serif; color: #000; }
.stApp { background: #EEF1F3; color-scheme: light; }
header[data-testid="stHeader"], footer, #MainMenu { display: none; }
.block-container { max-width: 880px; padding-top: 2rem; padding-bottom: 7rem; }

/* black text everywhere */
.stApp, .stApp p, .stApp span, .stApp label, .stApp li, .stApp h1, .stApp h2, .stApp h3,
[data-testid="stMarkdownContainer"] *, [data-testid="stCaptionContainer"] *,
section[data-testid="stSidebar"], section[data-testid="stSidebar"] * { color: #000 !important; }

/* sidebar: frosted glass, always open */
section[data-testid="stSidebar"],
section[data-testid="stSidebar"][aria-expanded="false"] {
  display: flex !important; transform: none !important; margin-left: 0 !important;
  visibility: visible !important; width: 300px !important; min-width: 300px !important;
  position: relative !important; z-index: 1 !important;
  background: rgba(225,231,235,.72) !important; backdrop-filter: blur(14px);
  border-right: 1px solid rgba(255,255,255,.6); }
[data-testid="stSidebarCollapseButton"],
[data-testid="stSidebarCollapsedControl"],
[data-testid="stExpandSidebarButton"] { display: none !important; }
[data-testid="stSidebarContent"] { padding-top: 5rem !important; }
section[data-testid="stSidebar"] .stButton > button {
  width: 100%; background: #0F5C6E; border: 0; border-radius: 10px;
  padding: .6rem 1rem; font-weight: 600; }
section[data-testid="stSidebar"] .stButton > button,
section[data-testid="stSidebar"] .stButton > button * { color: #fff !important; }
section[data-testid="stSidebar"] .stButton > button:hover { background: #0B4856; }
[data-testid="stSlider"] [role="slider"] { background: #0F5C6E !important; }
.side-title { font-size: 1.05rem; font-weight: 700; margin: .4rem 0 1rem; }
.legend-row { display: flex; align-items: center; gap: .55rem; font-size: .9rem; margin: .25rem 0; }
.swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

/* home page */
.hero { animation: heroIn .7s ease-out both; }
@keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.hero h1 { font-size: 2.6rem; font-weight: 700; letter-spacing: -.02em; margin: 3.5rem 0 .4rem; }
.hero p { font-size: 1.12rem; max-width: 36rem; line-height: 1.5; }
.tags { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1.1rem; }
.tag { display: inline-flex; align-items: center; gap: .45rem; padding: .38rem .85rem;
  background: rgba(255,255,255,.8); border: 1px solid #D5DDE2; border-radius: 999px;
  font-size: .9rem; font-weight: 600; backdrop-filter: blur(6px); }

/* chat */
[data-testid="stChatMessage"] { background: transparent; padding: .6rem 0; }
[data-testid="stChatMessage"]:has([data-testid="stChatMessageAvatarUser"]) {
  background: rgba(255,255,255,.85) !important; border: 1px solid #D5DDE2; border-radius: 14px;
  padding: .8rem 1rem; box-shadow: 0 2px 10px rgba(15,40,60,.06); }
[data-testid="stBottom"], [data-testid="stBottom"] > div { background: transparent !important; }
[data-testid="stChatInput"], [data-testid="stChatInput"] > div { background: #fff !important; }
[data-testid="stChatInput"] { border: 1px solid #B9C5CD !important; border-radius: 18px !important;
  box-shadow: 0 8px 28px rgba(15,40,60,.14); }
[data-testid="stChatInput"]:focus-within { border-color: #0F5C6E !important; box-shadow: 0 0 0 3px rgba(15,92,110,.18); }
[data-testid="stChatInput"] textarea { color: #000 !important; -webkit-text-fill-color: #000; }
[data-testid="stChatInput"] textarea::placeholder { color: #5B6B7A !important; -webkit-text-fill-color: #5B6B7A; }
[data-testid="stChatInput"] button { color: #0F5C6E !important; background: transparent !important; }
[data-testid="stChatInput"] button svg { color: #0F5C6E !important; opacity: 1 !important; }
[data-testid="stChatInput"] button:hover { background: #E1E7EB !important; }
[data-testid="stChatInput"] button:disabled svg { opacity: .55 !important; }

/* results card */
[class*="st-key-result_"] { background: rgba(255,255,255,.88); border: 1px solid #D5DDE2;
  border-radius: 16px; padding: 1.1rem 1.2rem; box-shadow: 0 6px 24px rgba(15,40,60,.08); }
[data-testid="stImage"] img { border-radius: 12px; border: 1px solid #D5DDE2; }
.verdict-row { display: flex; align-items: center; gap: .7rem; margin-bottom: .8rem; }
.verdict { font-size: 1.15rem; font-weight: 600; margin: 0; }
.badge { display: inline-block; padding: .2rem .75rem; border-radius: 999px; font-weight: 700; font-size: .82rem; }
.chip { display: inline-flex; align-items: center; gap: .45rem; padding: .3rem .7rem; margin: 0 .4rem .4rem 0;
  background: #fff; border: 1px solid #D5DDE2; border-radius: 999px; font-size: .88rem; font-weight: 500; }
.chip b { font-weight: 600; }
.caption { font-size: .82rem; margin-top: .25rem; }
html body .stApp [data-testid="stDownloadButton"] button { background: #0F5C6E !important; border: 0 !important;
  border-radius: 10px !important; font-weight: 600 !important; }
html body .stApp [data-testid="stDownloadButton"] button,
html body .stApp [data-testid="stDownloadButton"] button * { color: #fff !important; }
html body .stApp [data-testid="stDownloadButton"] button:hover { background: #0B4856 !important; }

/* password fields (eye icon) */
[data-testid="stTextInputRootElement"] {
  background: #fff !important; border: 1px solid #B9C5CD !important;
  border-radius: 10px !important; overflow: hidden; }
[data-testid="stTextInputRootElement"] * { background: #fff !important; }
[data-testid="stTextInputRootElement"] button:hover { background: #E1E7EB !important; }
[data-testid="stTextInputRootElement"] svg {
  background: transparent !important; fill: #000 !important; stroke: #000 !important; color: #000 !important; }

/* pop-up notices (toasts) */
[data-testid="stToast"] {
  background: #fff !important; border: 1px solid #D5DDE2 !important;
  border-radius: 12px !important; box-shadow: 0 6px 20px rgba(0,0,0,.18) !important; }
[data-testid="stToast"], [data-testid="stToast"] * { color: #000 !important; }
[data-testid="stToast"] svg { fill: #000 !important; stroke: #000 !important; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
</style>
""",
    unsafe_allow_html=True,
)


def set_background(image_name="bg.jpeg", veil=0.78):
    """Page background image with a light veil so black text stays readable.
    Lower veil = image more visible. Higher veil = image fainter."""
    f = Path(__file__).parent / image_name
    if not f.exists():
        return
    b64 = base64.b64encode(f.read_bytes()).decode()
    st.markdown(
        f"""
<style>
.stApp {{
  background:
    linear-gradient(rgba(238,241,243,{veil}), rgba(238,241,243,{veil})),
    url("data:image/jpeg;base64,{b64}") center / cover fixed no-repeat !important;
}}
[data-testid="stAppViewContainer"], [data-testid="stMain"],
[data-testid="stBottom"], [data-testid="stBottom"] > div {{
  background: transparent !important;
}}
</style>
""",
        unsafe_allow_html=True,
    )


set_background()

# =====================================================================
# 2. LOGIN GATE  (nothing below this line shows until the user logs in)
# =====================================================================
user = auth.require_login()

# =====================================================================
# 3. SIDEBAR
# =====================================================================
with st.sidebar:
    st.markdown('<div class="side-title">Inspection settings</div>', unsafe_allow_html=True)
    if st.button("New inspection", icon=":material/add:"):
        st.session_state.messages = []
        st.rerun()
    st.markdown("---")
    st.slider(
        "Detection confidence", 0.1, 0.95, 0.5, 0.05, key="min_conf",
        help="Higher values show only the defects the model is most sure about.",
    )
    st.markdown("**Defect types**")
    for k, v in DEFECT_COLORS.items():
        st.markdown(
            f'<div class="legend-row"><span class="swatch" style="background:{v}"></span>{k}</div>',
            unsafe_allow_html=True,
        )


# =====================================================================
# 4. DETECTION  (placeholder: replace detect() with your PyTorch/YOLO model)
# =====================================================================
def detect(img: Image.Image, min_conf: float):
    """Returns [{'label','conf','box':(x1,y1,x2,y2)}]. Demo boxes only: swap in your model here."""
    w, h = img.size
    rng = random.Random(w * h)
    found = []
    for label in rng.sample(list(DEFECT_COLORS), 3):
        bw, bh = rng.randint(w // 8, w // 4), rng.randint(h // 8, h // 4)
        x, y = rng.randint(0, w - bw), rng.randint(0, h - bh)
        found.append({"label": label, "conf": round(rng.uniform(0.55, 0.97), 2), "box": (x, y, x + bw, y + bh)})
    return [d for d in found if d["conf"] >= min_conf]


def annotate(img: Image.Image, findings):
    out = img.convert("RGB").copy()
    draw = ImageDraw.Draw(out)
    t = max(3, out.width // 250)
    try:
        font = ImageFont.load_default(size=max(14, out.width // 45))
    except TypeError:
        font = ImageFont.load_default()
    for f in findings:
        c = color_of(f["label"])
        x1, y1, x2, y2 = f["box"]
        draw.rectangle(f["box"], outline=c, width=t)
        tag = f"{f['label']} {int(f['conf'] * 100)}%"
        tw = draw.textlength(tag, font=font)
        th = font.size + 8 if hasattr(font, "size") else 20
        draw.rectangle((x1, max(0, y1 - th), x1 + tw + 12, y1), fill=c)
        draw.text((x1 + 6, max(0, y1 - th) + 3), tag, fill="white", font=font)
    return out


# =====================================================================
# 5. RESULT CARD
# =====================================================================
_icon = Path(__file__).parent / "logo_icon.png"
BOT_AVATAR = str(_icon) if _icon.exists() else ":material/search:"
USER_AVATAR = ":material/person:"


def render_result(r, idx=0):
    n = len(r["findings"])
    with st.container(key=f"result_{idx}"):
        if r["is_video"]:
            st.markdown(
                '<div class="verdict-row"><span class="verdict">Video received</span></div>',
                unsafe_allow_html=True,
            )
            st.video(r["video"])
            st.markdown(
                '<div class="caption">Frame-by-frame marking will appear here once the model is connected.</div>',
                unsafe_allow_html=True,
            )
            return
        if n == 0:
            verdict = "No defects found"
            badge = '<span class="badge" style="background:#D3F9D8;color:#1B5E20 !important">Clear</span>'
        else:
            verdict = f"{n} defect{'s' if n != 1 else ''} found"
            badge = '<span class="badge" style="background:#FFE3E3;color:#8A1C1C !important">Review needed</span>'
        st.markdown(
            f'<div class="verdict-row"><span class="verdict">{verdict}</span>{badge}</div>',
            unsafe_allow_html=True,
        )
        a, b = st.columns(2)
        with a:
            st.image(r["before"], width="stretch")
            st.markdown('<div class="caption">Original</div>', unsafe_allow_html=True)
        with b:
            st.image(r["after"], width="stretch")
            st.markdown('<div class="caption">Marked</div>', unsafe_allow_html=True)
        chips = "".join(
            f'<span class="chip"><span class="swatch" style="background:{color_of(f["label"])}"></span>'
            f'<b>{f["label"]}</b><span class="conf">{int(f["conf"] * 100)}%</span></span>'
            for f in r["findings"]
        )
        st.markdown(chips, unsafe_allow_html=True)
        buf = io.BytesIO()
        r["after"].save(buf, "PNG")
        st.download_button(
            "Download marked image", buf.getvalue(),
            file_name=f"marked_{r['name']}.png", mime="image/png", key=f"dl_{idx}",
        )


# =====================================================================
# 6. TOP BAR  (History + Account, edge to edge)
# =====================================================================
TOPBAR_CSS = """
<style>
.st-key-topbar { position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 999999;
  background: rgba(211,211,211,.95); backdrop-filter: blur(8px);
  border-bottom: 1px solid #D5DDE2; border-radius: 0; padding: .5rem 1.5rem; margin: 0;
  box-shadow: 0 4px 24px rgba(15,40,60,.08); }
.st-key-topbar [data-testid="stHorizontalBlock"] { align-items: center; gap: .5rem; }
.st-key-topbar [data-testid="stColumn"] { flex: 0 0 130px !important; width: 130px !important; min-width: 130px !important; }
.st-key-topbar [data-testid="stColumn"]:first-child { flex: 1 1 auto !important; width: auto !important; }
.st-key-topbar [data-testid="stPopover"] button { background: transparent; border: 0;
  font-weight: 600; box-shadow: none; }
.st-key-topbar [data-testid="stPopover"] button:hover { background: #E1E7EB; }
.block-container { padding-top: 5.5rem !important; }

/* dropdown menus */
html body [data-testid="stPopoverBody"] { background: #fff; min-width: 300px; color-scheme: light !important; }
[data-testid="stPopoverBody"], [data-testid="stPopoverBody"] * { color: #000 !important; }
[data-testid="stPopoverBody"] .stButton button { width: 100%; background: #0F5C6E; border: 0;
  border-radius: 10px; font-weight: 600; }
[data-testid="stPopoverBody"] .stButton button,
[data-testid="stPopoverBody"] .stButton button * { color: #fff !important; }

/* Account menu: expanders, forms, inputs */
html body [data-testid="stPopoverBody"] [data-testid="stExpander"] details,
html body [data-testid="stPopoverBody"] [data-testid="stExpander"] summary,
html body [data-testid="stPopoverBody"] [data-testid="stExpander"] summary * {
  background: #F4F6F7 !important; background-color: #F4F6F7 !important; color: #000 !important; }
html body [data-testid="stPopoverBody"] [data-testid="stExpander"] details {
  border: 1px solid #D5DDE2 !important; border-radius: 10px; }
html body [data-testid="stPopoverBody"] [data-testid="stExpander"] summary:hover,
html body [data-testid="stPopoverBody"] [data-testid="stExpander"] summary:hover * {
  background: #E1E7EB !important; background-color: #E1E7EB !important; }
html body [data-testid="stPopoverBody"] [data-testid="stExpander"] svg { fill: #000 !important; stroke: #000 !important; }
html body [data-testid="stPopoverBody"] [data-testid="stForm"] {
  background: transparent !important; border: 0 !important; padding: 0 !important; }
html body [data-testid="stPopoverBody"] input {
  background: #fff !important; color: #000 !important; -webkit-text-fill-color: #000 !important; }
html body [data-testid="stPopoverBody"] [data-testid="stFormSubmitButton"] button,
html body [data-testid="stPopoverBody"] [data-testid="stFormSubmitButton"] button:focus,
html body [data-testid="stPopoverBody"] [data-testid="stFormSubmitButton"] button:active {
  width: 100%; background: #0F5C6E !important; background-color: #0F5C6E !important;
  border: 0 !important; border-radius: 10px !important; font-weight: 600 !important; }
html body [data-testid="stPopoverBody"] [data-testid="stFormSubmitButton"] button,
html body [data-testid="stPopoverBody"] [data-testid="stFormSubmitButton"] button * {
  color: #fff !important; -webkit-text-fill-color: #fff !important; }
html body [data-testid="stPopoverBody"] [data-testid="stFormSubmitButton"] button:hover {
  background: #0B4856 !important; background-color: #0B4856 !important; }
html body [data-testid="stPopoverBody"] [data-testid="stCheckbox"] * { color: #000 !important; }
</style>
"""


def top_bar(user):
    st.markdown(TOPBAR_CSS, unsafe_allow_html=True)
    with st.container(key="topbar"):
        left, c_hist, c_acc = st.columns([6, 1.3, 1.5], vertical_alignment="center")
        with left:
            st.markdown(auth.logo_img(34), unsafe_allow_html=True)
        with c_hist:
            with st.popover("History", width="stretch"):
                recent = [m for m in st.session_state.messages if m.get("result")]
                if not recent:
                    st.caption("Inspections you run will appear here.")
                for m in reversed(recent):
                    r = m["result"]
                    n = len(r["findings"])
                    st.markdown(f"**{r['name']}**  \n{n} defect{'s' if n != 1 else ''} found")
        with c_acc:
            with st.popover("Account", width="stretch"):
                auth.account_menu(user)


top_bar(user)

# =====================================================================
# 7. HOME PAGE + CHAT
# =====================================================================
if not st.session_state.messages:
    tags = "".join(
        f'<span class="tag"><span class="swatch" style="background:{c}"></span>{k}</span>'
        for k, c in DEFECT_COLORS.items()
    )
    st.markdown(
        '<div class="hero"><h1 style="margin:2.5rem 0 .8rem">' + auth.logo_img() + "</h1>"
        "<p>Attach a photo or video of a part. DefectX AI boxes every defect it finds "
        "and sends the marked file back.</p>"
        f'<div class="tags">{tags}</div></div>',
        unsafe_allow_html=True,
    )

for i, m in enumerate(st.session_state.messages):
    with st.chat_message(m["role"], avatar=USER_AVATAR if m["role"] == "user" else BOT_AVATAR):
        if m.get("text"):
            st.write(m["text"])
        if m.get("attachment"):
            st.caption(f"Attached: {m['attachment']}")
        if m.get("result"):
            render_result(m["result"], i)

prompt = st.chat_input(
    "Attach a photo or video, or describe what to check",
    accept_file="multiple",
    file_type=["png", "jpg", "jpeg", "mp4", "mov", "avi"],
)

if prompt:
    files = list(prompt.files) if getattr(prompt, "files", None) else []
    text = getattr(prompt, "text", "") or ""
    st.session_state.messages.append(
        {"role": "user", "text": text, "attachment": ", ".join(f.name for f in files) or None}
    )
    if not files:
        st.session_state.messages.append(
            {"role": "assistant", "text": "Attach a photo or video and I'll mark any defects I find."}
        )
    for f in files:
        is_video = f.type.startswith("video")
        with st.spinner(f"Inspecting {f.name}"):
            if is_video:
                result = {"name": f.name, "is_video": True, "video": f.getvalue(), "findings": []}
            else:
                img = Image.open(f).convert("RGB")
                findings = detect(img, st.session_state.get("min_conf", 0.5))
                result = {"name": f.name, "is_video": False, "before": img,
                          "after": annotate(img, findings), "findings": findings}
        st.session_state.messages.append({"role": "assistant", "text": None, "result": result})
    st.rerun()