const router = require("express").Router();
const mysql = require("mysql");

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
// import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api"; // Supports ESM

const WooCommerce = new WooCommerceRestApi({
  url: "https://bbrak.saal.co.il",
  consumerKey: "ck_2f675706d51c6a655e601fda6af67089bac639d7",
  consumerSecret: "cs_a7ba06c99206faf1f39594b8968b278f4e903592",
  version: "wc/v3"
});

//
var con = mysql.createConnection({
  host: "shoply.c9tjqjh7enyf.us-east-1.rds.amazonaws.com",
  user: "eden",
  password: "Eden1234",
  database: "Eden"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to MYSQL");
});

async function AddOrderFromAPI(order_id) {
  WooCommerce.get(`orders/${order_id}`)
    .then(response => {
      var sql =
        "INSERT INTO Orders (order_id,status,date_created,date_modified,shipping_city,N_line_items,total_price,delivery_start,delivery_end,update_time, latest) VALUES(?)";
      var values = [
        order_id,
        response.data.status,
        response.data.date_created,
        response.data.date_modified,
        response.data.shipping.city,
        response.data.line_items.length,
        response.data.total,
        response.data.date_paid,
        response.data.date_complete,
        new Date(),
        true
      ];
      con.query(sql, [values], function(err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
      });
    })
    .catch(error => {
      console.log(error);
    });
}

async function isOrderInUpdatedDB(order_id) {
  con.query(`select * from Orders where order_id=${order_id} `, (err, rows) => {
    if (err) throw err;
    if (rows == 0) {
      AddOrderFromAPI(order_id);
    }
  });
}
async function insertUpdateToLatest(body) {
  con.query(
    `select * from Orders where order_id=${body.order_id} and latest=true `,
    (err, rows) => {
      if (err) throw err;
      var sql =
        "INSERT INTO Orders (order_id,status,date_created,date_modified,shipping_city,N_line_items,total_price,delivery_start,delivery_end,update_time, latest) VALUES(?)";
      var values = [
        body.order_id,
        body.status ? body.status : rows[0].status,
        body.date_created ? body.date_created : rows[0].date_created,
        body.date_modified ? body.date_modified : rows[0].date_modified,
        body.shipping_city ? body.shipping_city : rows[0].shipping_city,
        body.N_line_items ? body.N_line_items : rows[0].N_line_items,
        body.total_price ? body.total_price : rows[0].total_price,
        body.delivery_start ? body.delivery_start : rows[0].delivery_start,
        body.delivery_end ? body.delivery_end : rows[0].delivery_end,
        new Date(),
        true
      ];
      con.query(
        `update Orders set latest=false where order_id=${body.order_id} and latest=true `,
        function(err, result) {
          if (err) throw err;
          con.query(sql, [values], function(err, result) {
            if (err) throw err;
            console.log("Number of records inserted: " + result.affectedRows);
          });
        }
      );
    }
  );
}

async function DealWithEvent(body) {
  console.log(body.order_id);
  await isOrderInUpdatedDB(body.order_id);
  setTimeout(() => {
    insertUpdateToLatest(body);
  }, 2000);
}

router.route("/").post((req, res) => {
  DealWithEvent(req.body);
  setTimeout(() => {
    con.query(
      `select * from Orders where order_id=${req.body.order_id}`,
      (err, rows) => {
        if (err) throw err;
        res.json(rows);
      }
    );
  }, 3000);
});

module.exports = router;
