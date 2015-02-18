var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();

var file = fs.readFileSync('./commits/xab.csv').toString().split('\n');
var chunklength = 2;




file.shift();

file = file.map(function(e) {
    return [e.split(',')[0],e.split(',')[3]]
});
file.pop();

var data = {};
var index = 0;
file.forEach(function (row) {
    data[row[0]] = {
        title: row[1],
        index: index++
    }
});

var isNum = function(a) {
    return ~~a == a;
}

var readJson = function (file) {
    return JSON.parse(fs.readFileSync(file).toString());
}

var writeJson = function (file, data) {
    return fs.writeFileSync(file, JSON.stringify(data, null, 4));
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.set('env', 'production');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/start/:id", function (req, res, next) {
    if (!isNum(req.params.id)) return next();
    var index = req.params.id*chunklength;
    var commit = file[index];
    res.redirect('/' + req.params.id + '/' + commit[0]);
});

app.get('/:id/:commit', function (req, res, next) {
    if (data[req.params.commit] === undefined || !isNum(req.params.id)) {
        next();
    }else {
        var index = data[req.params.commit].index;
        var id = req.params.id;
        if (id*chunklength <= index && index < (id+1)*chunklength) {
            res.render('commit', {
                commit: req.params.commit,
                title: data[req.params.commit].title,
                diff: fs.readFileSync('./commits/' + req.params.commit+ '.txt').toString(),
                user_id: req.params.id
            });
        }else {
            res.render("finished");
        }
    }
    // res.send("hello " + req.params.id + " " + req.params.commit);
});

app.get('/:verb/:commit/:id', function (req, res, next) {
    var vote = null;
    if (req.params.verb=="yes") vote = 'yes';
    else if (req.params.verb=="no") vote = 'no';
    else if (req.params.verb=="idk") vote = 'idk';

    if (data[req.params.commit] === undefined || !isNum(req.params.id)) return next();

    if (vote === null) return next();

    var c = req.params.commit;
    var jsonfile = './commits/' + c + '.json';
    var votes = fs.existsSync(jsonfile)?readJson(jsonfile):{'yes': 0, 'no': 0, 'idk': 0};

    votes[vote]++;

    writeJson(jsonfile, votes);

    var id = req.params.id;
    var index = data[c].index+1;

    if (id*chunklength <= index && index < (id+1)*chunklength) {
        var nextcommit = file[index][0];
        console.log('/' + id + '/' + nextcommit);
        res.redirect('/' + id + '/' + nextcommit);
    }else {
        res.render("finished");
    }

})

// app.get('/', function (req, res, next) {

// })


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
