from flask import Flask, render_template, request, redirect, session, jsonify
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from functools import wraps

# ===============================
#        APP CONFIG
# ===============================
app = Flask(__name__)
app.secret_key = "cs50-final-project"

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# ===============================
#        DATABASE
# ===============================
def get_db():
    conn = sqlite3.connect("beat.db")
    conn.row_factory = sqlite3.Row
    return conn

# ===============================
#        LOGIN REQUIRED
# ===============================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function

# ===============================
#        ROUTES
# ===============================
@app.route("/")
@login_required
def home():
    return render_template("home.html")

# -------- REGISTER --------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            return "Missing username or password"

        db = get_db()
        hash_pw = generate_password_hash(password)

        try:
            db.execute(
                "INSERT INTO users (username, hash) VALUES (?, ?)",
                (username, hash_pw)
            )
            db.commit()
        except:
            return "Username already exists"

        return redirect("/login")

    return render_template("register.html")

# -------- LOGIN --------
@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        db = get_db()
        user = db.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        ).fetchone()

        if user is None or not check_password_hash(user["hash"], password):
            return "Invalid username or password"

        session["user_id"] = user["id"]
        return redirect("/")

    return render_template("login.html")

# -------- LOGOUT --------
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

# -------- LEVEL 1 --------
@app.route("/level1")
@login_required
def level1():
    return render_template("level1.html")

# -------- SUBMIT SCORE --------
@app.route("/submit_score", methods=["POST"])
@login_required
def submit_score():
    data = request.get_json()

    score = data["score"]
    status = data["status"]
    user_id = session["user_id"]

    session["score"] = score
    session["status"] = status

    db = get_db()
    db.execute(
        "INSERT INTO scores (user_id, score, status) VALUES (?, ?, ?)",
        (user_id, score, status)
    )
    db.commit()

    return jsonify({"success": True})

# -------- RESULT --------
@app.route("/result")
@login_required
def result():
    score = session.get("score", 0)
    status = session.get("status", "lose")
    return render_template("result.html", score=score, status=status)

# ===============================
#        RUN APP
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
