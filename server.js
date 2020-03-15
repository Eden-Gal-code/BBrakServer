const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4040;

app.enable("trust proxy");

app.use(cors());
app.use(express.json());

//connecting to MYSQL

//Use Routes
const userRouter = require("./routes/routes");

app.use("/", userRouter);

//Listening on Port 4040
app.listen(port, err => {
  if (err) throw err;
  console.log(`listening on ${port}`);
});
