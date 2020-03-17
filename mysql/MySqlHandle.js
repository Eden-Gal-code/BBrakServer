const mysql = require("mysql");
const config = require("../config.json");
const util = require("util");

function MYSQLH() {
  this.con = mysql.createConnection(config.sql);
  this.con.query = util.promisify(this.con.query).bind(this.con);

  this.Connect = function() {
    this.con.connect(function(err) {
      if (err) throw err;
      console.log("Connected to MYSQL thew Handle");
    });
  };

  this.SelectAll = async function(order_id) {
    this.con = mysql.createConnection(config.sql);
    this.con.query = util.promisify(this.con.query).bind(this.con);
    this.con.connect();
    let Rows = await this.con.query(
      `select * from Orders where order_id=${order_id}`
    );
    this.con.end();
    this.con = mysql.createConnection(config.sql);
    this.con.query = util.promisify(this.con.query).bind(this.con);
    return Rows;
  };

  this.InsertFromAPI = async function(values) {
    this.con = mysql.createConnection(config.sql);
    this.con.query = util.promisify(this.con.query).bind(this.con);
    this.con.connect();
    var sql =
      "INSERT INTO Orders (order_id,status,date_created,date_modified,shipping_city,N_line_items,total_price,delivery_start,delivery_end,update_time, latest) VALUES(?)";

    await this.con.query(sql, [values]).then(() => {
      console.log("Inset from API");
    });

    this.con.end();
    this.con = mysql.createConnection(config.sql);
    this.con.query = util.promisify(this.con.query).bind(this.con);
    console.log("Ended INSERTFROMAPI");
  };

  this.SelectLatest = async function(order_id) {
    this.con = mysql.createConnection(config.sql);
    this.con.query = util.promisify(this.con.query).bind(this.con);
    this.con.connect();
    let Rows = await this.con.query(
      `select * from Orders where order_id=${order_id} and latest=true`
    );
    this.con.end();

    return Rows;
  };

  this.UpdateAndInsert = async function(values, order_id) {
    this.con = mysql.createConnection(config.sql);
    this.con.query = util.promisify(this.con.query).bind(this.con);
    this.con.connect();
    var sql =
      "INSERT INTO Orders (order_id,status,date_created,date_modified,shipping_city,N_line_items,total_price,delivery_start,delivery_end,update_time, latest) VALUES(?)";
    let a = await this.con
      .query(
        `update Orders set latest=false where order_id=${order_id} and latest=true `
      )
      .then(result => {
        this.con.query(sql, [values], function(err, result) {
          if (err) throw err;
          console.log("Number of records inserted: " + result.affectedRows);
        });
      });

    this.con.end();
    this.con = mysql.createConnection(config.sql);
    this.con.query = util.promisify(this.con.query).bind(this.con);
    return a;
  };
}
module.exports = MYSQLH;
