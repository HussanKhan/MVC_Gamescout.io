from flask import Flask, jsonify, make_response, request, render_template, redirect
from flask_cors import CORS
import json

app = Flask(__name__)

@app.route('/masterdeals', methods=["GET"])
def amazon_api():
    with open("masterdeals.json", "r") as f:
        fil = json.load(f)
    return make_response(jsonify(fil), 200)


if __name__ == '__main__':
    CORS(app)
    app.run(host="127.0.0.1", port="8080")