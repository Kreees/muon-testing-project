var Q = require("q");
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var sh = require('should');
var mysql = require('mysql');
var domain = require('domain');


process.exit = function() {};


describe('migration module test: case 12 (invalid attribute type)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set12/models_ch/';
//    var test_models_changed_path = cfg.path + '/test/model_sets/set1/models_ch/';

    before(function(done) {
        var mysql_client = mysql.createConnection({
            host:'localhost',
            user: 'root',
            password: ''
        });
        mysql_client.connect(function(err, results) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
            console.log("mysql server connected");
            mysql_client.query(
                'drop database somedb', function(err) {
                    if (err) console.log(err);
                    mysql_client.query(
                        'create database somedb', function(err) {
                            if (err) console.log(err)
                            done()
                        }
                    )
                }
            );
        });
    }); //очищаем базы данных



    before(function() {
        global.__mcfg__ = { serverMode: 'development' };
        if (!g.file.exists(dir))
            g.file.mkdir(dir);
        if (g.file.exists(cfg.path + '/migrations/history.db'))
            fs.unlink(cfg.path + '/migrations/history.db', function(err) {
                if (err) console.log('unlinking error 1 ' + err)
            });
        if(g.file.exists(cfg.path + '/undefined.db'))
            fs.unlink(cfg.path + '/undefined.db', function(err) {
                if (err) console.log('unlinking error 2 ' + err)
            });
        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            if (err) {console.log('readdir error ' + err)}
            for (var i in models) {
                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {if (err) console.log('unlinking error 3 ' +err)});
            }
        });
//        fs.readdir(test_models_source_path, function(err, models) {
//            if (err) {console.log(err)}
//            for (var i in models) {
//                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
//            }
//        });
    }); //удаляем всё и загружаем модель

    before(function(done) {
        muon = require('muon');
        muon.ready(function() {
            fs.readdir(test_models_source_path, function(err, models) {
                if (err) {console.log(err)}
                for (var i in models) {
                    fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
                }
                done();
            });
        });
    });

    it('should detect incorrect argument', function(done) {
//        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload()
            .done(function() {
                console.log('done');
//                m.migration.migrate(true);
                done();
            },
        function(err) {done(err)});
    });

//    it('should detect incorrect argument', function(done) {
//        var d = domain.create();
//        d.on('error', function(err) {
//            console.log('error caught: ' + err);
//            err.message.should.startWith('Unknown property type');
//            done()
//        });
//        d.run(function() {
//            global.__mcfg__ = { serverMode: 'development' };
//            muon = require('muon');
//        });
//    });

});