from xml.dom.minidom import Document
from flask import Flask, jsonify, request, render_template
from pikepdf import Pdf
import re
import logging
import json
from pikepdf._core import PasswordError

app = Flask(__name__, static_folder='static')

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/crack_password', methods=['POST'])
def crack_password():
    data = request.json
    logging.debug("Received data: %s", data)

    filename = data.get('filename')
    min_digits = int(data.get('minDigits', 1))
    max_digits = int(data.get('maxDigits', -1))
    matching_regex = data.get('matchingRegex')

    logging.debug("Filename: %s", filename)
    logging.debug("Min Digits: %d", min_digits)
    logging.debug("Max Digits: %d", max_digits)
    logging.debug("Matching Regex: %s", matching_regex)

    try:
        with open(filename, 'rb') as f:
            pass
    except FileNotFoundError:
        logging.error("File not found: %s", filename)
        return jsonify({'message': 'File not found'}), 404

    def try_password(digits, filename, pattern):
        logging.debug("Trying passwords with %d digits", digits)
        n = 1
        n_max = 10**digits
        while n < n_max:
            pn = str(n).zfill(digits)
            if pattern is None or pattern.match(pn):
                try:
                    logging.debug("Trying password: %s", pn)
                    Pdf.open(filename_or_stream=filename, password=pn)
                    logging.debug("Password found: %s", pn)
                    return pn
                except PasswordError:
                    logging.debug("Password incorrect: %s", pn)
                except Exception as e:
                    logging.error("Exception: %s", str(e))
            n += 1
        logging.debug("Could not find password with %d digits", digits)
        return None

    pattern = None
    if matching_regex:
        try:
            pattern = re.compile(matching_regex)
        except re.error as e:
            logging.error("Invalid regex pattern: %s", matching_regex)
            return jsonify({'message': 'Invalid regex pattern'}), 400

    max_digits = max_digits if max_digits >= min_digits else min_digits

    for digits in range(min_digits, max_digits + 1):
        logging.debug("Trying passwords with %d digits", digits)
        password = try_password(digits, filename, pattern)
        if password:
            return jsonify({'password': password}), 200

    logging.debug("Could not crack the password")
    return jsonify({'message': 'Could not crack the password'}), 400

if __name__ == '__main__':
    app.run(debug=True)