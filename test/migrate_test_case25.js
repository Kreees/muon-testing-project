var Q = require("q");
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var mysql = require('mysql');
var sqlite = require('sqlite3');

process.exit = function() {};


describe('migration module test: case 25 (interrupt migration)', function() {

    var test_models_source_path = cfg.path + '/test/model_sets/set25/models_ch/';
//    var test_models_changed_path = cfg.path + '/test/model_sets/set5/models_ch/';
//    var test_models_changed_path1 = cfg.path + '/test/model_sets/set5/models_ch1/';

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
    }); //очищаем базу данных

    before(function(done) {
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
        fs.readdir(test_models_source_path, function(err, models) {
            if (err) {console.log(err)}
            for (var i in models) {
                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
            }
            done();
        });
    }); //удаляем все и загружаем исходные модели

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
        muon.ready(function() {
            console.log('muon ready in case 5');
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                muon.ready(function() {
                    console.log('reloaded in case 5');
                    m.migration.migrate();
                    setTimeout(function() {
                    process.stdin.write('^C^C\n');
                        done()
                },1000)
                });
            });
        });
    }); //ищем изменения и проводим первую миграцию

    it('should migrate', function(done) {
        m.migration.migrate().done(function() {
            done()
        });
    });

    it('should check number of states', function(done) {
        var history_db = new sqlite.Database(cfg.path + '/migrations/history.db');
        var state_count0 = {};
        history_db.serialize(function() {
            history_db.get('select count(*) from state',function(err,res) {
                console.log(res);
                state_count0 = JSON.stringify(res);
                var state_count1 = state_count0.split(":");
                var state_count2 = state_count1[1].split("}",1);
                state_count2[0].should.eql('1');
                done();
            })
        });
    })

});