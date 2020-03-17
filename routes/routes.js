const router = require("express").Router();
const mysql = require("mysql");
const config = require("../config.json");
const MYSQLH = require("../mysql/MySqlHandle");
const util = require("util");

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
// import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api"; // Supports ESM

const WooCommerce = new WooCommerceRestApi(config.WC);

const MySqlHandle = new MYSQLH();

async function AddOrderFromAPI(order_id, callback) {
  await WooCommerce.get(`orders/${order_id}`)
    .then(async response => {
      var delivery_start = new Date(
        response.data.iconic_delivery_meta.date.substr(-4) +
          "-" +
          response.data.iconic_delivery_meta.date.substr(3, 2) +
          "-" +
          response.data.iconic_delivery_meta.date.substr(0, 2)
      ).setHours(
        response.data.iconic_delivery_meta.timeslot.substr(0, 2),
        response.data.iconic_delivery_meta.timeslot.substr(3, 2),
        "00"
      );
      var delivery_end = new Date(
        response.data.iconic_delivery_meta.date.substr(-4) +
          "-" +
          response.data.iconic_delivery_meta.date.substr(3, 2) +
          "-" +
          response.data.iconic_delivery_meta.date.substr(0, 2)
      ).setHours(
        response.data.iconic_delivery_meta.timeslot.substr(-4, -2),
        response.data.iconic_delivery_meta.timeslot.substr(-2, -2),
        "00"
      );

      this.values = [
        order_id,
        response.data.status,
        response.data.date_created,
        response.data.date_modified,
        response.data.shipping.city,
        response.data.line_items.length,
        response.data.total,
        new Date(delivery_start),
        new Date(delivery_end),
        new Date(),
        true
      ];
      await MySqlHandle.InsertFromAPI(this.values);
    })
    .catch(error => {
      console.log(error);
    });
  return await MySqlHandle.SelectLatest(order_id);
}

async function isOrderInUpdatedDB(order_id) {
  var rows = await MySqlHandle.SelectAll(order_id);

  if (rows == 0) {
    return await AddOrderFromAPI(order_id);
  } else {
    return 0;
  }
}
async function insertUpdateToLatest(body, id, Rows) {
  var rows = await MySqlHandle.SelectLatest(id);

  var values = [
    id,
    "status" in body ? body.status : rows[0].status,
    "date_created" in body ? body.date_created : rows[0].date_created,
    "date_modified" in body ? body.date_modified : rows[0].date_modified,
    "shipping_city" in body ? body.shipping_city : rows[0].shipping_city,
    "N_line_items" in body ? body.N_line_items : rows[0].N_line_items,
    "total_price" in body ? body.total_price : rows[0].total_price,
    "delivery_start" in body ? body.delivery_start : rows[0].delivery_start,
    "delivery_end" in body ? body.delivery_end : rows[0].delivery_end,
    new Date(),
    true
  ];
  await MySqlHandle.UpdateAndInsert(values, id);
  return await MySqlHandle.SelectAll(id);
}

async function DealWithEvent(body, id) {
  rows = await isOrderInUpdatedDB(id);

  return await insertUpdateToLatest(body, id, rows);
}

router.route("/:id").post((req, res) => {
  WooCommerce.get(`orders/${req.params.id}`)
    .then(async response => {
      res.json(await DealWithEvent(req.body, req.params.id));
    })
    .catch(error => {
      res.json("error");
    });
});

module.exports = router;
