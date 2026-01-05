from flask import Flask, render_template

# Wir sagen Flask: Templates sind im Ordner 'template', Static-Files sind im Root '.'
app = Flask(__name__, template_folder='template', static_folder='.')

@app.route('/')
def test_base():
    # Rendert NUR die base.html ohne Inhalt dazwischen
    return render_template('base.html')

if __name__ == '__main__':
    print("Starte Test-Server... öffne http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
