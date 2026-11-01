import base64
import hashlib
import io
import hmac
import os
import sqlite3
from contextlib import closing
from datetime import date
from pathlib import Path

import streamlit as st
from PIL import Image

DB_PATH = Path(__file__).parent / "users.db"


# ---------- Database ----------
def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users ("
        "username TEXT PRIMARY KEY, salt BLOB NOT NULL, pw_hash BLOB NOT NULL, created_at TEXT)"
    )
    # older databases were created without these columns
    cols = [r[1] for r in conn.execute("PRAGMA table_info(users)")]
    if "created_at" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN created_at TEXT")
    if "photo" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN photo BLOB")
    return conn


def _hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)


def create_user(username: str, password: str):
    """Returns an error message, or None if the account was created."""
    username = username.strip().lower()
    if len(username) < 3:
        return "Username must be at least 3 characters."
    if len(password) < 6:
        return "Password must be at least 6 characters."
    salt = os.urandom(16)
    try:
        with closing(_connect()) as conn, conn:
            conn.execute(
                "INSERT INTO users (username, salt, pw_hash, created_at) VALUES (?, ?, ?, ?)",
                (username, salt, _hash(password, salt), date.today().strftime("%d %b %Y")),
            )
    except sqlite3.IntegrityError:
        return "That username is already taken. Choose another one."
    return None


def verify_user(username: str, password: str) -> bool:
    username = username.strip().lower()
    with closing(_connect()) as conn:
        row = conn.execute(
            "SELECT salt, pw_hash FROM users WHERE username = ?", (username,)
        ).fetchone()
    if row is None:
        return False
    salt, stored = row
    return hmac.compare_digest(stored, _hash(password, salt))


def member_since(username: str):
    with closing(_connect()) as conn:
        row = conn.execute(
            "SELECT created_at FROM users WHERE username = ?", (username.strip().lower(),)
        ).fetchone()
    return row[0] if row and row[0] else None


def change_password(username: str, old: str, new: str):
    """Returns an error message, or None if the password was changed."""
    if not verify_user(username, old):
        return "Current password is wrong."
    if len(new) < 6:
        return "New password must be at least 6 characters."
    salt = os.urandom(16)
    with closing(_connect()) as conn, conn:
        conn.execute(
            "UPDATE users SET salt = ?, pw_hash = ? WHERE username = ?",
            (salt, _hash(new, salt), username.strip().lower()),
        )
    return None


def delete_user(username: str, password: str):
    """Returns an error message, or None if the account was deleted."""
    if not verify_user(username, password):
        return "Password is wrong. Your account was not deleted."
    with closing(_connect()) as conn, conn:
        conn.execute("DELETE FROM users WHERE username = ?", (username.strip().lower(),))
    return None


def set_photo(username: str, file_bytes: bytes):
    """Crop to a square, shrink to 256px, store as JPEG. Returns an error message or None."""
    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except Exception:
        return "That file isn't a valid image."
    side = min(img.size)
    left, top = (img.width - side) // 2, (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize((256, 256), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    with closing(_connect()) as conn, conn:
        conn.execute(
            "UPDATE users SET photo = ? WHERE username = ?",
            (buf.getvalue(), username.strip().lower()),
        )
    return None


def get_photo(username: str):
    with closing(_connect()) as conn:
        row = conn.execute(
            "SELECT photo FROM users WHERE username = ?", (username.strip().lower(),)
        ).fetchone()
    return row[0] if row and row[0] else None


def remove_photo(username: str):
    with closing(_connect()) as conn, conn:
        conn.execute("UPDATE users SET photo = NULL WHERE username = ?", (username.strip().lower(),))


def avatar_html(username: str, size: int = 64) -> str:
    """Round profile photo, or the user's initial on a teal circle if no photo is set."""
    photo = get_photo(username)
    if photo:
        b64 = base64.b64encode(photo).decode()
        return (
            f'<img src="data:image/jpeg;base64,{b64}" alt="Profile photo" '
            f'style="width:{size}px;height:{size}px;border-radius:50%;object-fit:cover;'
            f'display:block;border:2px solid #0F5C6E;">'
        )
    initial = (username.strip()[:1] or "?").upper()
    return (
        f'<div style="width:{size}px;height:{size}px;border-radius:50%;background:#0F5C6E;'
        f'display:flex;align-items:center;justify-content:center;font-weight:700;'
        f'font-size:{int(size * 0.45)}px;color:#fff !important;'
        f'-webkit-text-fill-color:#fff;">{initial}</div>'
    )


# ---------- UI ----------
def logo_img(height=110):
    """Full DefectX AI logo (logo_full.png next to this file) as an inline image.
    Falls back to plain text if the file is missing."""
    f = Path(__file__).parent / "logo_full.png"
    if not f.exists():
        return "DefectX AI"
    b64 = base64.b64encode(f.read_bytes()).decode()
    return (
        f'<img src="data:image/png;base64,{b64}" alt="DefectX AI" '
        f'style="height:{height}px;width:auto;display:block;">'
    )


LOGIN_CSS = """
<style>
[data-testid="stForm"] { background: rgba(255,255,255,.88); border: 1px solid #D5DDE2;
  border-radius: 14px; padding: 1.2rem 1.2rem .6rem; }
[data-testid="stTextInput"] input { background: #fff !important; color: #000 !important;
  -webkit-text-fill-color: #000; }
[data-testid="stTextInput"] > div > div { background: #fff !important; border-radius: 10px;
  border: 1px solid #B9C5CD; }
[data-testid="stTextInput"] > div > div:focus-within { border-color: #0F5C6E; }
.stApp [data-testid="stFormSubmitButton"] button { width: 100%; background: #0F5C6E; border: 0;
  border-radius: 10px; padding: .6rem 1rem; font-weight: 600; }
.stApp [data-testid="stFormSubmitButton"] button,
.stApp [data-testid="stFormSubmitButton"] button * { color: #fff !important; }
.stApp [data-testid="stFormSubmitButton"] button:hover { background: #0B4856; }
</style>
"""


def login_page():
    st.markdown(LOGIN_CSS, unsafe_allow_html=True)
    _, mid, _ = st.columns([1, 2, 1])
    with mid:
        st.markdown(
            '<div class="hero"><h1 style="margin:2.5rem 0 .8rem">' + logo_img() + "</h1>"
            "<p>Log in to inspect parts and surfaces for defects.</p></div>",
            unsafe_allow_html=True,
        )
        tab_login, tab_signup = st.tabs(["Log in", "Create account"])

        with tab_login:
            with st.form("login_form"):
                u = st.text_input("Username", key="login_user")
                p = st.text_input("Password", type="password", key="login_pass")
                if st.form_submit_button("Log in"):
                    if verify_user(u, p):
                        st.session_state.user = u.strip().lower()
                        st.rerun()
                    else:
                        st.error("Wrong username or password. Check both and try again.")

        with tab_signup:
            with st.form("signup_form"):
                u = st.text_input("Choose a username", key="signup_user")
                p1 = st.text_input("Choose a password", type="password", key="signup_pass")
                p2 = st.text_input("Confirm password", type="password", key="signup_pass2")
                if st.form_submit_button("Create account"):
                    if p1 != p2:
                        st.error("The two passwords don't match.")
                    else:
                        err = create_user(u, p1)
                        if err:
                            st.error(err)
                        else:
                            st.success("Account created. Open the Log in tab to sign in.")


def require_login() -> str:
    """Call near the top of the app. Shows the login page and stops until signed in."""
    user = st.session_state.get("user")
    if user:
        return user
    login_page()
    st.stop()


PENCIL_SVG = (
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>"
    "<path fill='%230F5C6E' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 "
    "000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/></svg>"
)

DIALOG_CSS = """
<style>
html body [data-testid="stDialog"] div[role="dialog"] { background: #fff !important; color-scheme: light; }
html body [data-testid="stDialog"] * { color: #000 !important; }
html body [data-testid="stDialog"] [data-testid="stFileUploaderDropzone"] {
  background: #F4F6F7 !important; border: 1px dashed #B9C5CD !important; border-radius: 10px !important; }
html body [data-testid="stDialog"] [data-testid="stFileUploaderDropzone"] button {
  background: #0F5C6E !important; border: 0 !important; border-radius: 8px !important; }
html body [data-testid="stDialog"] [data-testid="stFileUploaderDropzone"] button,
html body [data-testid="stDialog"] [data-testid="stFileUploaderDropzone"] button * { color: #fff !important; }
html body [data-testid="stDialog"] .stButton button {
  width: 100%; background: #0F5C6E !important; border: 0 !important; border-radius: 10px !important;
  font-weight: 600 !important; }
html body [data-testid="stDialog"] .stButton button,
html body [data-testid="stDialog"] .stButton button * { color: #fff !important; }
html body [data-testid="stDialog"] .stButton button:disabled { opacity: .45; }
</style>
"""


def _avatar_css(user: str) -> str:
    """Turns the st.button keyed 'avatar_btn' into a round photo with a pencil badge."""
    photo = get_photo(user)
    if photo:
        bg = "url(data:image/jpeg;base64," + base64.b64encode(photo).decode() + ") center / cover no-repeat"
        txt = "transparent"
    else:
        bg, txt = "#0F5C6E", "#fff"
    css = """
<style>
.st-key-avatar_btn, .st-key-avatar_btn > div, .st-key-avatar_btn .stButton {
  position: relative; width: 60px !important; min-width: 60px !important; max-width: 60px !important;
  height: 60px !important; flex: none !important; }
html body [data-testid="stPopoverBody"] .st-key-avatar_btn button {
  box-sizing: border-box !important; flex: none !important;
  width: 56px !important; min-width: 56px !important; max-width: 56px !important;
  height: 56px !important; min-height: 56px !important; max-height: 56px !important;
  aspect-ratio: 1 / 1 !important; padding: 0 !important; line-height: 1 !important;
  border-radius: 50% !important; border: 2px solid #0F5C6E !important; background: @BG@ !important; }
html body [data-testid="stPopoverBody"] .st-key-avatar_btn button:hover,
html body [data-testid="stPopoverBody"] .st-key-avatar_btn button:focus,
html body [data-testid="stPopoverBody"] .st-key-avatar_btn button:active {
  background: @BG@ !important; border-color: #0F5C6E !important; filter: brightness(.92); }
html body [data-testid="stPopoverBody"] .st-key-avatar_btn button,
html body [data-testid="stPopoverBody"] .st-key-avatar_btn button * {
  color: @TXT@ !important; -webkit-text-fill-color: @TXT@ !important;
  font-size: 24px !important; font-weight: 700 !important; }
.st-key-avatar_btn::after { content: ""; position: absolute; right: 0; bottom: 0; width: 22px; height: 22px;
  border-radius: 50%; border: 1px solid #B9C5CD; pointer-events: none;
  background: #fff url("@PENCIL@") center / 13px no-repeat; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
</style>
"""
    return css.replace("@BG@", bg).replace("@TXT@", txt).replace("@PENCIL@", PENCIL_SVG)


@st.dialog("Profile photo")
def photo_dialog(user: str):
    st.markdown(DIALOG_CSS, unsafe_allow_html=True)
    st.markdown(
        '<div style="display:flex;justify-content:center;margin:.4rem 0 .8rem">'
        + avatar_html(user, 110) + "</div>",
        unsafe_allow_html=True,
    )
    up = st.file_uploader("Choose a new photo", type=["png", "jpg", "jpeg"])
    has_photo = get_photo(user) is not None
    cols = st.columns(2 if has_photo else 1)
    with cols[0]:
        if st.button("Save photo", key="save_photo_btn", disabled=up is None):
            err = set_photo(user, up.getvalue())
            if err:
                st.error(err)
            else:
                st.rerun()
    if has_photo:
        with cols[1]:
            if st.button("Remove photo", key="remove_photo_btn"):
                remove_photo(user)
                st.rerun()


def account_menu(user: str):
    """Put this inside the Account popover: profile, change password, clear history,
    delete account and log out."""
    st.markdown(_avatar_css(user), unsafe_allow_html=True)
    since = member_since(user)
    pic, who = st.columns([1.3, 3], vertical_alignment="center")
    with pic:
        if st.button((user.strip()[:1] or "?").upper(), key="avatar_btn", help="Change profile photo"):
            photo_dialog(user)
    with who:
        st.markdown(f"**{user}**")
        if since:
            st.caption(f"Member since {since}")

    with st.expander("Change password"):
        with st.form("change_pw_form", clear_on_submit=True):
            old = st.text_input("Current password", type="password")
            new = st.text_input("New password", type="password")
            new2 = st.text_input("Confirm new password", type="password")
            if st.form_submit_button("Update password"):
                if new != new2:
                    st.toast("The new passwords don't match.", icon="⚠️")
                else:
                    err = change_password(user, old, new)
                    st.toast(err or "Password updated.", icon="⚠️" if err else "✅")

    if st.button("Clear inspection history", key="clear_history_btn"):
        st.session_state.messages = []
        st.rerun()

    with st.expander("Delete account"):
        with st.form("delete_acct_form"):
            pw = st.text_input("Confirm with your password", type="password")
            sure = st.checkbox("I understand this can't be undone")
            if st.form_submit_button("Delete my account"):
                if not sure:
                    st.toast("Tick the box to confirm.", icon="⚠️")
                else:
                    err = delete_user(user, pw)
                    if err:
                        st.toast(err, icon="⚠️")
                    else:
                        st.session_state.clear()
                        st.rerun()

    if st.button("Log out", key="logout_btn"):
        st.session_state.clear()
        st.rerun()