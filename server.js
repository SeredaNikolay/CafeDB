const express = require("express");
const mysql = require('mysql');
const path = require('path');
const urlencodedParser = require('body-parser').urlencoded({extended: false});;
const { DBWorker } = require('./DBWorker.js')
const app = express();

var db_worker=DBWorker.getInstance();

app.use(express.static("public"));

app.get('/',function(req,res) {
  res.sendFile(path.join(__dirname+'/public/HTML/index.html'));
});

app.get('/query', (req, res) => {
  var queryIndex=req.query.Index;
  var queryData=req.query.Data;
  var connection=db_worker.getMySQLConnection(mysql);
  var SQLThematicQuery = db_worker.getThematicQuery(queryIndex, queryData);
  connection.query(SQLThematicQuery, (err, rows, fields)=>{db_worker.SQLThematicQueryCallback(queryIndex, rows, err, res)});
  db_worker.closeMySQLConnection(connection);
})
app.get('/initialization', (req, res) => {
  res.send({
    TableNames: db_worker.getTableNames(),
    QueryNames: db_worker.getQueryNames(),
    DataCheckFuncs: db_worker.getQueryDataCheckFuncs()
  })
})
app.get('/create', (req, res) => {
  var tableName = req.query.TableName;
  var tableHeadingsID=req.query.TableHeadingsID;
  var values=req.query.Values;
  db_worker.insertRecordIntoDB(mysql, tableName, tableHeadingsID, values, res);
})
app.get('/read', (req, res) => {
  var tableName=req.query.TableName;
  var connection=db_worker.getMySQLConnection(mysql); 
  var SQLReadAllQuery = db_worker.getSQLAllQuery(tableName);
  connection.query(SQLReadAllQuery, (err, rows, fields)=>{db_worker.SQLReadAllQueryCallback(tableName, rows, err, res)});
  db_worker.closeMySQLConnection(connection);
})
app.get('/update', (req, res) => {
  var tableName = req.query.TableName;
  var values=req.query.Values;
  var tableHeadings=req.query.TableHeadings;
  var ErrStr=db_worker.LogicCheck(db_worker.getLogicCheckFuncs(tableName), values);
  if(ErrStr=="")
    db_worker.updateRecordInDB(mysql, tableName, tableHeadings, values);
  var Object={
    TableName: tableName,
    NewValues: Array.from(values),
    ErrMess: ErrStr
  };
  res.send(Object);
})
app.post('/delete', urlencodedParser, (req, res) => {
  var tableName = req.body.TableName;
  var idName=req.body.IdName;
  var idValue=req.body.IdValue;
  db_worker.deleteRecordFromDB(mysql, tableName, idName, idValue);
})

app.listen(8080)
//http://localhost:8080