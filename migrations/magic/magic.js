var mysql = require('mysql');

var mysql_client = mysql.createConnection({
    host:'localhost',
    user: 'root',
    password: ''
});
console.log('123');
mysql_client.connect(function(err, results) {
    if (err) {
        console.log("ERROR: " + err.message);
        throw err;
    }
    console.log("connected.");
//    mysql_client.query('in somedb insert into person_new (name_new) select name from person', function(err) {
//            if (err) console.log(err);
//            else console.log('magic success');
//        }
//
//    );
    mysql_client.query('use somedb', function(err) {
        if (err) console.log(err);
        else {
            mysql_client.query('insert into person_new (name_new) select name from person', function(err) {
                    if (err) console.log(err);
                    else console.log('magic success');
                    mysql_client.query('update person_new,person set person_new.surname_new = person.surname where person.id = person_new.id', function(err) {
                            if (err) console.log(err);
                            else console.log('magic success');
                            mysql_client.query('update person_new,person set person_new.age_new = person.age where person.id = person_new.id', function(err) {
                                    if (err) console.log(err);
                                    else console.log('magic success');
                                    mysql_client.end();

                                }
                            );
                        }
                    );

                }
            );
        }
    });
});
