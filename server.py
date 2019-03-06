from flask import Flask, jsonify, make_response, request, render_template, redirect
from flask_cors import CORS
import json

app = Flask(__name__)



@app.route('/static', methods=["GET"])
def stop():
    return make_response("Not Allowed", 401)

@app.route('/static/js', methods=["GET"])
def stopjs():
    return make_response("Not Allowed", 401)

@app.route('/static/css', methods=["GET"])
def stopcss():
    return make_response("Not Allowed", 401)

@app.route('/static/images', methods=["GET"])
def stopimage():
    return make_response("Not Allowed", 401)

@app.route('/static/images/Gamecovers', methods=["GET"])
def stopcovers():
    return make_response("Not Allowed", 401)





@app.route('/', methods=["GET"])
def home():
    return render_template('redesign.html')




# More Game Info
@app.route('/gamedeal', methods=["GET"])
def gameDeal():

    title = request.args.get('game')

    # Connec tto DBs
    deals_DATABASE = GetDeals()
    gamextra = GetGameInfo()

    # Finds game details from deep database
    db_res = gamextra.game_info(title)

    gamextra.close_session()
    
    try:
        # Finds deal related to game in current db
        game_deals = deals_DATABASE.deal_info(title)
    except Exception:
        game_deals = []

    deals_DATABASE.close_session()

    price = 0

    # Find lowest price for game
    for g in game_deals:
        gamePrice = '.'.join(re.findall(r'\d+', g.price))

        if price == 0:
            price = gamePrice

        if gamePrice < price:
            price = gamePrice

    return render_template('redesign.html', title=db_res.name, image=db_res.image, summary=db_res.summary, lowestPrice=price)


@app.route('/masterdeals', methods=["GET"])
def amazon_api():
    with open("masterdeals.json", "r") as f:
        fil = json.load(f)
    return make_response(jsonify(fil), 200)


if __name__ == '__main__':
    CORS(app)
    app.run(host="127.0.0.1", port="8080", debug=True)