const mysql = require('mysql');

class DBWorker{
    static #Instance=null;
    //---------------------------------------------------------------------MySql соединение
    getMySQLConnection(mysql){
    var connection = mysql.createConnection({
      database: '_cafe_',
      host: "localhost",
      user: "root",
      password: "Hello#333",
      dateStrings: 'date' //Без этого некоторые даты могут некорректно запрашиваться
    });
    return connection;
  }
  closeMySQLConnection(connection){
    connection.end();
  }
  //---------------------------------------------------------------------
  nameCheck="return /^[A-ZА-ЯЁ]{1}[a-zа-яё]+[ a-zа-яё]*$/.test(data)&&data.length<=45";
  mealType="return data=='Отсутствует'||data=='Первое'||data=='Второе'||data=='Третье'||data=='Напиток'";
  notNegIntNumberCheck="return /^\\d+$/.test(data)";
  yesNoCheck="return data=='Да'||data=='Нет'";
  notNegFloatCheck="return /^\\d+$/.test(data)||/^\\d+\\.\\d+$/.test(data)";
  FIOCheck="return /^[A-ZА-ЯЁ]{1}[a-zа-яё]+ [A-ZА-ЯЁ]{1}[a-zа-яё]+ [A-ZА-ЯЁ]{1}[a-zа-яё]+$/.test(data)&&data.length<=120";
  MGCheck="return data=='М'||data=='Ж'";
  inaccessibilityCheck="return data=='Недоступен'||data=='Доступен'";
  datetimeCheck="return /^\\d{4}-(0\\d|1[0-2])-([0-2]\\d|3[0-1]) ([0-1]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$/.test(data)";
  dateCheck="return /^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\\d|3[0-1])$/.test(data)";

  twoDatetimeCheck="return /^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\\d|3[0-1]) ([0-1]\\d|2[0-3]):[0-5]\\d:[0-5]\\d \\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\\d|3[0-1]) ([0-1]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$/.test(data)";
  alwaysOk="return true";
  posIntNum="return /^[1-9]\\d*$/.test(data)";
  twoPosInt="return /^[1-9]\\d* [1-9]\\d*$/.test(data)";
  //---------------------------------------------------------------------Шаблоны тематических MySql запросов
  #ThematicQuery=
  [
    [
        this.getSqlUnexpectedExpensesQuery, 
        "Непредвиденные траты за промежуток времени",
        this.twoDatetimeCheck
    ],
    [
        this.getSqlIngredientsCostQuery, 
        "Ингредиенты, входящие в блюдо, и их стоимость",
        this.nameCheck
    ],
    [
        this.getSqlAvailableCooksQuery, 
        "Свободные повара",
        this.alwaysOk
    ],
    [
        this.getSqlExpirationProductsQuery, 
        "Список продуктов, у которых истекает срок годности n числа",
        this.dateCheck
    ],
    [
        this.getSqlMealCostIngredientsOnlyQuery, 
        "Рассчитать стоимость блюда (кг/л/шт) без наценки и приготовления",
        this.nameCheck
    ],
    [
        this.getSqlMealCostWithoutCookingQuery, 
        "Рассчитать стоимость блюда без приготовления",
        this.nameCheck
    ],
    [
        this.getSqlExtraChargeSumByDayQuery, 
        "Рассчитать сумму наценок на все блюда за день",
        this.dateCheck
    ],
    [
        this.getSqlOrderCalorificQuery, 
        "Рассчитать калорийность заказа",
        this.posIntNum
    ],
    [
        this.getSqlAvrgOrderCostByIntervalQuery, 
        "Рассчитать среднюю стоимость заказа за интервал времени",
        this.twoDatetimeCheck
    ],
    [
        this.getSqlMostPopularMealsByIntervalQuery, 
        "Показать наиболее часто заказываемые блюда в интервале",
        this.twoDatetimeCheck
    ],
    [
        this.generateSqlOrderWithCalorificNotMoreQuery, 
        "Составить заказ (только блюда) калорийностью не более n",
        this.posIntNum
    ],
    [
        this.generateSqlOrderWithCalorificNotMoreForVegsQuery, 
        "Составить заказ (только блюда) калорийностью не более n для вегетарианцев",
        this.posIntNum
    ],
    [
        this.getSqlpurchaseCostQuery, 
        "Показать ингредиенты, которых меньше n, и стоимость докупки до n",
        this.twoPosInt
    ],
    [
        this.getSqlMenuWithIngredient, 
        "Составить меню из блюд, содержащих определенный ингредиент и показать, сколько их еще не использовано",
        this.nameCheck
    ]
  ];
  getSqlUnexpectedExpensesQuery(values){
    var val=values.split(' ');
    var firstDatetime=val[0]+' '+val[1], lastDatetime=val[2]+' '+val[3];
    var select="SELECT SUM(unexpected_costs) ";
    var from="FROM orders ";
    var where="WHERE datetime BETWEEN '"+firstDatetime+"' AND '"+lastDatetime+"';";
    return select+from+where;
  }
  getSqlIngredientsCostQuery(values){
    var mealName=values;
    var select="SELECT DISTINCT ingredients.name, ingredients.cost "
    var from="FROM ingredients ";
    var j1="JOIN ingredient_instances ON ingredients.id=ingredient_instances.ingredient_id ";
    var j2="JOIN meal_instances_to_ingredient_instances ON meal_instances_to_ingredient_instances.ingredient_instance_id=ingredient_instances._id_ ";
    var j3="JOIN meal_instances ON meal_instances_to_ingredient_instances.meal_instance_id=meal_instances._id_ ";
    var j4="JOIN meals ON meal_instances.meal_id=meals.id WHERE meals.name='"+mealName+"';";
    return select+from+j1+j2+j3+j4;
  }
  getSqlAvailableCooksQuery(values){
    var select="SELECT full_name "
    var from="FROM cooks "
    var where="WHERE inaccessibility='Доступен';";
    return select+from+where;
  }
  getSqlExpirationProductsQuery(values){
      var date=values;
      var s1="SELECT meals.name as name, product_instances.quantity, product_instances.unit, product_instances.used ";
      var f1="FROM product_instances ";
      var j1_1="JOIN meal_instances ON meal_instances._id_=product_instances.id ";
      var j1_2="JOIN meals ON meal_instances.meal_id=meals.id ";
      var w1="WHERE product_instances.expiration_datetime BETWEEN '"+date+" 00:00:00' AND '"+date+" 23:59:59' ";
      var u="UNION "
      var s2="SELECT ingredients.name as name, product_instances.quantity, product_instances.unit, product_instances.used ";
      var f2="FROM product_instances ";
      var j2_1="JOIN ingredient_instances ON ingredient_instances._id_=product_instances.id ";
      var j2_2="JOIN ingredients ON ingredient_instances.ingredient_id=ingredients.id ";
      var w2="WHERE product_instances.expiration_datetime BETWEEN '"+date+" 00:00:00' AND '"+date+" 23:59:59';";
      return s1+f1+j1_1+j1_2+w1+u+s2+f2+j2_1+j2_2+w2;
  }
  getSqlMealCostIngredientsOnlyQuery(values){
    var mealName=values;
    var s1="SELECT IF(product_instances.unit='шт', 1*meal_instance_cost/product_instances.quantity, 1000*meal_instance_cost/product_instances.quantity) as example_cost ";
    var f1="FROM ";
    var s2="(SELECT DISTINCT SUM( IF(product_instances.unit='шт', ingredients.cost*product_instances.quantity/10, ingredients.cost*product_instances.quantity/1000)) as meal_instance_cost, meal_instances._id_ as mi_id ";
    var f2="FROM ingredients ";
    var j1="JOIN ingredient_instances ON ingredients.id=ingredient_instances.ingredient_id ";
    var j2="JOIN meal_instances_to_ingredient_instances ON meal_instances_to_ingredient_instances.ingredient_instance_id=ingredient_instances._id_ ";
    var j3="JOIN meal_instances ON meal_instances_to_ingredient_instances.meal_instance_id=meal_instances._id_ ";
    var j4="JOIN meals ON meal_instances.meal_id=meals.id ";
    var j5="JOIN product_instances ON product_instances.id=ingredient_instances._id_ ";
    var w1="WHERE meals.name='"+mealName+"' LIMIT 1) as tmpTable ";
    var j6="JOIN product_instances ON product_instances.id=mi_id;";
    return s1+f1+s2+f2+j1+j2+j3+j4+j5+w1+j6;
  }
  getSqlMealCostWithoutCookingQuery(values){
    var mealName=values;
    var s1="SELECT IF(product_instances.unit='шт', 1*meal_instance_cost/product_instances.quantity+m_ex_ch, 1000*meal_instance_cost/product_instances.quantity+10*m_ex_ch) as example_cost ";
    var f1="FROM ";
    var s2="(SELECT DISTINCT SUM( IF(product_instances.unit='шт', ingredients.cost*product_instances.quantity/10, ingredients.cost*product_instances.quantity/1000)) as meal_instance_cost, meal_instances._id_ as mi_id, meals.extra_charge as m_ex_ch ";
    var f2="FROM ingredients ";
    var j1="JOIN ingredient_instances ON ingredients.id=ingredient_instances.ingredient_id ";
    var j2="JOIN meal_instances_to_ingredient_instances ON meal_instances_to_ingredient_instances.ingredient_instance_id=ingredient_instances._id_ ";
    var j3="JOIN meal_instances ON meal_instances_to_ingredient_instances.meal_instance_id=meal_instances._id_ ";
    var j4="JOIN meals ON meal_instances.meal_id=meals.id ";
    var j5="JOIN product_instances ON product_instances.id=ingredient_instances._id_ ";
    var w1="WHERE meals.name='"+mealName+"' LIMIT 1) as tmpTable ";
    var j6="JOIN product_instances ON product_instances.id=mi_id;";
    return s1+f1+s2+f2+j1+j2+j3+j4+j5+w1+j6;
  }
  getSqlExtraChargeSumByDayQuery(values){
    var date=values;
    var s="SELECT SUM(IF(product_instances.unit='шт',meals.extra_charge*product_instances.quantity,meals.extra_charge*product_instances.quantity/100)) as money ";
    var f="FROM meals ";
    var j1="JOIN meal_instances ON meal_instances.meal_id=meals.id ";
    var j2="JOIN product_instances ON product_instances.id=meal_instances._id_ ";
    var j3="JOIN orders_to_meal_instances as o_to_mi ON o_to_mi.meal_instance_id=meal_instances._id_ ";
    var j4="JOIN orders ON o_to_mi.order_id=orders.id ";
    var j5="WHERE orders.datetime BETWEEN '"+date+" 00:00:00' AND '"+date+" 23:59:59';";
    return s+f+j1+j2+j3+j4+j5;
  }
  getSqlOrderCalorificQuery(values){
    var orderID=values;
    var s="SELECT ROUND(SUM(product_instances.quantity*ingredients.calorific*ingredients.from_v_to_m_mul/IF(product_instances.unit='шт',1,100))) as calorific ";
    var f="FROM ingredients ";
    var j1="JOIN ingredient_instances ON ingredients.id=ingredient_instances.ingredient_id ";
    var j2="JOIN meal_instances_to_ingredient_instances ON meal_instances_to_ingredient_instances.ingredient_instance_id=ingredient_instances._id_ ";
    var j3="JOIN meal_instances ON meal_instances_to_ingredient_instances.meal_instance_id=meal_instances._id_ ";
    var j4="JOIN orders_to_meal_instances as o_to_mi ON meal_instances._id_=o_to_mi.meal_instance_id ";
    var j5="JOIN orders ON o_to_mi.order_id=orders.id ";
    var j6="JOIN product_instances ON product_instances.id=ingredient_instances._id_ ";
    var w="WHERE orders.id="+orderID+";"
    return s+f+j1+j2+j3+j4+j5+j6+w;
  }
  getSqlAvrgOrderCostByIntervalQuery(values){
    var val=values.split(' ');
    var first_dt=val[0]+' '+val[1], last_dt=val[2]+' '+val[3];
    var s="SELECT get_order_avg_cost_by_interval('"+first_dt+"', '"+last_dt+"');";
    return s;
  }
  getSqlMostPopularMealsByIntervalQuery(values){
    var val=values.split(' ');
    var first_dt=val[0]+' '+val[1], last_dt=val[2]+' '+val[3];
    var s="SELECT meals.name, COUNT(*) as quantity ";
    var f="FROM meals ";
    var j1="JOIN meal_instances ON meal_instances.meal_id=meals.id ";
    var j2="JOIN orders_to_meal_instances ON orders_to_meal_instances.meal_instance_id=meal_instances._id_ ";
    var j3="JOIN orders ON orders.id=orders_to_meal_instances.order_id ";
    var w="WHERE orders.datetime BETWEEN '"+first_dt+"' AND '"+last_dt+"' ";
    var groupBy="GROUP BY meals.name ";
    var orderBy="ORDER BY quantity DESC, meals.name ASC LIMIT 10;";
    return s+f+j1+j2+j3+w+groupBy+orderBy;
  }
  generateSqlOrderWithCalorificNotMoreQuery(values){
      var maxCalorific=values;
      var sp1="SELECT IF(product_instances.unit='шт',";
      var sp2="IF(FLOOR(("+maxCalorific+"/3)/(calorific/product_instances.quantity)) IS NULL, 10, FLOOR(("+maxCalorific+"/3)/(calorific/product_instances.quantity))),";
      var sp3="IF(FLOOR(("+maxCalorific+"/3)/(100*calorific/product_instances.quantity)*100) IS NULL, 200, FLOOR(("+maxCalorific+"/3)/(100*calorific/product_instances.quantity)*100))) as quantity,";
      var sp4="product_instances.unit as unit,meal_name ";
      var f1="FROM (SELECT meal_instances._id_ as mi_id,meals.name as meal_name,ROUND(SUM(product_instances.quantity*ingredients.calorific*ingredients.from_v_to_m_mul/IF(product_instances.unit='шт',1,100))) as calorific ";
      var f2="FROM ingredients ";
      var j1="JOIN ingredient_instances ON ingredients.id=ingredient_instances.ingredient_id ";
      var j2="JOIN meal_instances_to_ingredient_instances ON meal_instances_to_ingredient_instances.ingredient_instance_id=ingredient_instances._id_ ";
      var j3="JOIN meal_instances ON meal_instances_to_ingredient_instances.meal_instance_id=meal_instances._id_ ";
      var j4="JOIN orders_to_meal_instances as o_to_mi ON meal_instances._id_=o_to_mi.meal_instance_id ";
      var j5="JOIN orders ON o_to_mi.order_id=orders.id ";
      var j6="JOIN product_instances ON product_instances.id=ingredient_instances._id_ ";
      var j7="JOIN meals ON meals.id=meal_instances.meal_id ";
      var grBy="GROUP BY meals.id ";
      var ordBy="ORDER BY RAND() LIMIT 3) as calorific ";
      var j8="JOIN product_instances ON product_instances.id=mi_id;"
      return sp1+sp2+sp3+sp4+f1+f2+j1+j2+j3+j4+j5+j6+j7+grBy+ordBy+j8;
  }
  generateSqlOrderWithCalorificNotMoreForVegsQuery(values){
    var maxCalorific=values;
    var sp1="SELECT IF(product_instances.unit='шт',";
	var sp2="IF(FLOOR(("+maxCalorific+"/3)/(calorific/product_instances.quantity)) IS NULL, 10, FLOOR(("+maxCalorific+"/3)/(calorific/product_instances.quantity))),";
    var sp3="IF(FLOOR(("+maxCalorific+"/3)/(100*calorific/product_instances.quantity)*100) IS NULL, 200, FLOOR(("+maxCalorific+"/3)/(100*calorific/product_instances.quantity)*100))) as quantity,";
    var sp4="product_instances.unit as unit,meal_name ";
    var f1="FROM (SELECT meal_instances._id_ as mi_id,meals.name as meal_name,SUM(ingredients.is_meat='Да') as has_meat,ROUND(SUM(product_instances.quantity*ingredients.calorific*ingredients.from_v_to_m_mul/IF(product_instances.unit='шт',1,100))) as calorific ";
    var f2="FROM ingredients ";
    var j1="JOIN ingredient_instances ON ingredients.id=ingredient_instances.ingredient_id ";
    var j2="JOIN meal_instances_to_ingredient_instances ON meal_instances_to_ingredient_instances.ingredient_instance_id=ingredient_instances._id_ ";
    var j3="JOIN meal_instances ON meal_instances_to_ingredient_instances.meal_instance_id=meal_instances._id_ ";
    var j4="JOIN orders_to_meal_instances as o_to_mi ON meal_instances._id_=o_to_mi.meal_instance_id ";
    var j5="JOIN orders ON o_to_mi.order_id=orders.id ";
    var j6="JOIN product_instances ON product_instances.id=ingredient_instances._id_ ";
    var j7="JOIN meals ON meals.id=meal_instances.meal_id ";
    var grBy="GROUP BY meals.id ";
    var ordBy="ORDER BY RAND()) as calorific ";
    var j8="JOIN product_instances ON product_instances.id=mi_id ";
    var w="WHERE has_meat=0 LIMIT 3;";
    return sp1+sp2+sp3+sp4+f1+f2+j1+j2+j3+j4+j5+j6+j7+grBy+ordBy+j8+w;
  }
  getSqlpurchaseCostQuery(values){
    var val=values.split(' ');
    var countQuantity=val[0], m_or_v_Quantity=val[1];
    var s1="SELECT name,cost,on_hand,IF(unit='шт',FLOOR(IF(on_hand<"+countQuantity+",("+countQuantity+"-on_hand)*cost/10,0)),FLOOR(IF(on_hand<"+m_or_v_Quantity+",("+m_or_v_Quantity+"-on_hand)*cost/1000,0))) as purchase_cost,unit ";
    var f1="FROM (";
    var s2="SELECT ingredients.name as name,ingredients.cost as cost,SUM(IF(product_instances.used='Нет',product_instances.quantity,0))  as on_hand,product_instances.unit ";
    var f2="FROM ingredients ";
    var j1="LEFT JOIN ingredient_instances ON ingredient_instances.ingredient_id=ingredients.id ";
    var j2="LEFT JOIN product_instances ON product_instances.id=ingredient_instances._id_ ";
    var grBy="GROUP BY ingredients.name) as tmp ";
    return s1+f1+s2+f2+j1+j2+grBy;
  }
  getSqlMenuWithIngredient(values){
    var ingName=values;
    var s="SELECT meals.name as name,SUM(IF(product_instances.used='Нет',product_instances.quantity,0)) as quantity,product_instances.unit ";
    var f="FROM ingredients ";
    var j1="JOIN ingredient_instances ON ingredient_instances.ingredient_id=ingredients.id ";
    var j2="JOIN meal_instances_to_ingredient_instances as mi_to_ii ON mi_to_ii.ingredient_instance_id=ingredient_instances._id_ ";
    var j3="JOIN meal_instances ON meal_instances._id_=mi_to_ii.meal_instance_id ";
    var j4="JOIN meals ON meals.id=meal_instances.meal_id ";
    var j5="JOIN product_instances ON product_instances.id=meal_instances._id_ ";
    var j6="WHERE ingredients.name='"+ingName+"' ";
    var grBy="GROUP BY meals.name ";
    var ordBy="ORDER BY RAND() LIMIT 3;";
    return s+f+j1+j2+j3+j4+j5+j6+grBy+ordBy;
  }
  //---------------------------------------------------------------------Шаблоны CRUD MySql запросов
  getSqlUpdateQuery(tableName, colName, val){
    var updt="UPDATE "+tableName;
    var st=" SET";
    for(var cNameInd=1; cNameInd<colName.length; cNameInd++){
      st=st+" "+colName[cNameInd]+"='"+val[cNameInd]+"'"+(cNameInd+1!=colName.length?",":"");
    }
    var whr=" WHERE "+colName[0]+"='"+val[0]+"';";
    return updt+st+whr;
  }
  getSqlInsertIntoQuery(tableName, colName, val){
    var insrt="INSERT INTO "+tableName;
    var clmnNames=" ("+colName.join(',')+")";
    var values=" VALUES (";
    for(var cNameInd=0; cNameInd<colName.length; cNameInd++){
        values=values+"'"+val[cNameInd]+"'"+(cNameInd+1!=colName.length?",":"");
    }
    values=values+");"
    return insrt+clmnNames+values;
  }
  getSqlDeleteQuery(tableName, idColName, idVal){
      var dlt="DELETE FROM "+tableName;
      var whr=" WHERE "+idColName+"='"+idVal+"';"
      return dlt+whr;
  }
  getSQLAllQuery(tableName){
    var sqlTemplate = "SELECT * FROM ??;";
    var replaces = [tableName];
    var SQLQuery = mysql.format(sqlTemplate, replaces);
    return SQLQuery;
  }
  //---------------------------------------------------------------------MySql запросы
  getTableHeadingsIDFromDB(tableName, recordsResponse, reqRes){
    var sqlTemplate="SELECT COLUMN_NAME "
                    +"FROM information_schema.COLUMNS "
                    +"WHERE TABLE_NAME = ? "
                    +"ORDER BY ORDINAL_POSITION"
    var replaces=[tableName];
    var SqlQueryheadingsID=mysql.format(sqlTemplate, replaces);
    
    var connection =this.getMySQLConnection(mysql); 
    connection.query(SqlQueryheadingsID, (err, rows, fields)=>{this.SQLQueryHeadingsIDCallback(tableName, recordsResponse, rows, err, reqRes)});
    this.closeMySQLConnection(connection);
  }
  getLastInsertedRecord(tableName, colName, res){
    var sqlTemplate="SELECT * "
                    +"FROM ?? "
                    +"ORDER BY ?? DESC "
                    +"LIMIT 1;"
    var replaces=[tableName, colName[0]];
    var SqlQueryLastInsertedRecord=mysql.format(sqlTemplate, replaces);

    var connection =this.getMySQLConnection(mysql); 
    connection.query(SqlQueryLastInsertedRecord, (err, rows, fields)=>{this.SqlQueryLastInsertedRecordCallback(tableName, colName, rows, err, res)});//
    this.closeMySQLConnection(connection);
  }
  updateRecordInDB(mysql, tableName, colName, val){
    var sqlUpdateQuery=this.getSqlUpdateQuery(tableName, colName, val);
    var connection =this.getMySQLConnection(mysql); 
    connection.query(sqlUpdateQuery, (err, rows, fields)=>{if(err) throw err});
    this.closeMySQLConnection(connection);
  }
  insertRecordIntoDB(mysql, tableName, colName, val, res){
    var insertIntoQuery=this.getSqlInsertIntoQuery(tableName, colName, val);
    var connection =this.getMySQLConnection(mysql); 
    connection.query(insertIntoQuery, (err, rows, fields)=>{this.SQLQueryinsertIntoCallback(tableName, colName, err, res)});
    this.closeMySQLConnection(connection);
  }
  deleteRecordFromDB(mysql, tableName, idColName, idVal){
    var deleteQuery=this.getSqlDeleteQuery(tableName, idColName, idVal);
    var connection =this.getMySQLConnection(mysql); 
    connection.query(deleteQuery, (err, rows, fields)=>{if(err) throw err});
    this.closeMySQLConnection(connection);
  }
  getRecords(rows){
    var records=[];
    for (var rowIDX=0; rowIDX<rows.length; rowIDX++){
      var record=rows[rowIDX];
      records[rowIDX]= new Array();
      for(var field in record) {
        records[rowIDX].push(record[field]);
      }
    }
    return records;
  }
  //---------------------------------------------------------------------Коллбэки
  SQLQueryHeadingsIDCallback(tableName, recordsResponse, headingsIDResponse, err, reqRes){
    if(err) 
      throw err;
    var Object={
      TableName: tableName,
      TableCaption: this.getTableCaption(tableName),
      TableHeadings: this.getTableHeadings(tableName),
      TableHeadingsID: this.getTableHeadingsID(headingsIDResponse),
      TableDefaultValues: this.getTableDefaultValues(tableName),
      Records: this.getRecords(recordsResponse),
      DataCheckFuncs: this.getDataCheckFuncs(tableName)
    } 
    reqRes.send({Object: Object});
  }
  SQLReadAllQueryCallback(tableName, recordsResponse, err, reqRes){
    if(err) 
       throw err;
    this.getTableHeadingsIDFromDB(tableName, recordsResponse, reqRes);
  }
  SQLQueryinsertIntoCallback(tableName, colName, err, res){
    if(err) 
        throw err;
    this.getLastInsertedRecord(tableName, colName, res);
  }
  SqlQueryLastInsertedRecordCallback(tableName, tableHeadingsID, row, err, res){
    if(err) 
        throw err;
    var Object={
        TableName: tableName,
        TableHeadingsID: tableHeadingsID,
        Values: this.getLastInsertedRecordValues(row),
    } 
    res.send(Object);
  }
  SQLThematicQueryCallback(queryIndex, row, err, res){
    if(err)
        throw err;
    var Object={
        Caption: this.getThematicQueryCaptions(queryIndex),
        Headings: this.getThematicQueryHeadings(queryIndex),
        Row: this.getThematicQueriesValues(row),
    }
    res.send(Object);
  }
  //---------------------------------------------------------------------Получение данных для ответа
  getQueryNames(){
    var qNames=[];
    var themQueries=this.#ThematicQuery;
    for(var i=0; i<themQueries.length; i++){
        qNames[i]=themQueries[i][1];
    }
    return qNames;
  }
  getQueryDataCheckFuncs(){
    var qFuncs=[];
    var themQueries=this.#ThematicQuery;
    for(var i=0; i<themQueries.length; i++){
        qFuncs[i]=themQueries[i][2];
    }
    return qFuncs;
  }
  getTableNames(){
    var TableNames=[
      "meals",
      "ingredients",
      "cooks"
    ];
    return TableNames;
  }
  getTableCaption(tableName){
    var TableCaption={
      "meals": "Блюда",
      "ingredients": "Ингредиенты",
      "cooks": "Повара"
    }
    return TableCaption[tableName];
  }
  getTableHeadings(tableName){
    var TableHeadings={
      "meals": ["Название", "Тип кухни", "Тип блюда", "Наценка"],
      "ingredients": ["Мясо", "Цена", "Название", "Калорийность", "Множитель перевода (V->m)"],
      "cooks": ["ФИО", "Пол", "Зарплата", "Доступность", "Квалификация", "Дата рождения"]
    }
    return TableHeadings[tableName];
  }
  getTableHeadingsID(tableHeadingsID){
    var arr=[];
    for(var i=0;i<tableHeadingsID.length; i++){
      arr[i]=tableHeadingsID[i]["COLUMN_NAME"];
    }
    return arr;
  }
  getTableDefaultValues(tableName){
    var TableDefaultValues={
      "meals": ["Клубника", "Отсутствует", "Отсутствует", "10"],
      "ingredients": ["Нет", "400", "Клубника", "41", "1"],
      "cooks": ["Петров Петр Петрович", "М", "30000", "Доступен", "0001-00-00 00:00:00", "1990-05-04"]
    }
    return TableDefaultValues[tableName];
  }
  getLastInsertedRecordValues(rows){
      var value=[]
      var i=0;
      for(var jsonKey in rows[0]){
        value[i++]=rows[0][jsonKey];
      }
      return value;
  }
  //---------------------------------------------------------------------Получение данных для ответа на тематические запросы
  getThematicQuery(index, queryData){
    return this.#ThematicQuery[index][0](queryData);
  }
  getThematicQueryCaptions(index){
    var captions=
    [
        "Непредвиденные расходы за интервал",
        "Ингредиенты, входящие в блюдо, и их стоимость",
        "Свободные повара",
        "Продукты, у которых срок годности истекает n числа",
        "Цена ингредиентов для блюда",
        "Цена ингредиентов для блюда вместе с наценкой",
        "Cумма наценок на все блюда за день",
        "Калорийность заказа",
        "Cредняя стоимость заказа за интервал времени",
        "Популярне блюда в интервале",
        "Заказ калорийностью не более n",
        "Заказ калорийностью не более n для вегетарианцев",
        "Стоимость докупки ингредиентов до n",
        "Меню из блюд с определенным ингредиентом"
    ];
    return captions[index];
  }
  getThematicQueryHeadings(index){
    var headings=
    [
        ["Рубли"],
        ["Ингредиент", "Цена"],
        ["ФИО"],
        ["Название", "Количество", "Единица измерения", "Использовано"],
        ["Рубли"],
        ["Рубли"],
        ["Рубли"],
        ["Калорийность"],
        ["Рубли"],
        ["Название", "Количество заказов"],
        ["Количество", "Единица измерения", "Название"],
        ["Количество", "Единица измерения", "Название"],
        ["Название", "Цена", "В наличии", "Стоимость докупки", "Единица измерения"],
        ["Названиие", "Количество", "Единица измерения"]
    ];
    return headings[index];
  }
  getThematicQueriesValues(rows){
    var value=[]
    var j;
    for(var i=0; i<rows.length; i++){
        j=0;
        value[i]=new Array();
        value[i][j++]='q'+i;
        for(var jsonKey in rows[i]){
            value[i][j++]=rows[i][jsonKey];
        }
    }
    return value;
}
  //---------------------------------------------------------------------Проверка логики
  getCount_ms(strDatetime){
    var intervals=strDatetime.split(' ');
    var dateElem=intervals[0].split('-');
    var timeElem=intervals[1].split(':');
    var ms=365*24*60*60*1000*parseInt(dateElem[0]);
    ms+=30*24*60*60*1000*parseInt(dateElem[1]);
    ms+=24*60*60*1000*parseInt(dateElem[2]);
    ms+=60*60*1000*parseInt(timeElem[0]);
    ms+=60*1000*parseInt(timeElem[1]);
    ms+=1000*parseInt(timeElem[2]);
    return ms;
  }
  getLogicCheckFuncs(tableName){
    var LogicCheck={
      "meals": [],
      "ingredients": [],
      "cooks": [this.isOkSalary, this.isOkBirthdate, this.isOkQualification]
    };
    return LogicCheck[tableName];
  }
  LogicCheck(LoicCheckFunc, valArr){
    var errStr="";
    for(var i=0; i<LoicCheckFunc.length; i++){
      errStr=errStr+LoicCheckFunc[i](valArr);
    }
    return errStr;
  }
  isOkSalary(valArr){
    var salary=parseInt(valArr[3], 10);
    return salary<10000?"\nМинимальная зарплата - 10000":"";
  }
  isOkBirthdate(valArr){
    var birthdate=valArr[6];
    if(birthdate<"1940-01-01")
      return "\nМинимальная дата рождения - 1940-01-01";
    var cuDateDatetime=new Date();
    cuDateDatetime.setYear(1900+cuDateDatetime.getYear()-18);
    var minBirthdateForWorkNow=cuDateDatetime.toISOString().substr(0, 10);
    if(minBirthdateForWorkNow<birthdate)
      return "\nДля работы в этом заведении минимальный возраст - 18"
    return "";
  }
  isOkQualification(valArr){
    var db_worker=DBWorker.getInstance();
    var qualification=valArr[5];
    var birthdate=valArr[6]+"T00:00:00Z";
    var qual_ms=db_worker.getCount_ms(qualification);
    var birthdate_ms=new Date(birthdate).getTime();
    var now_ms=new Date().getTime();
    return birthdate_ms>now_ms-qual_ms?"\nКвалификация не может быть больше продолжительности жизни":"";
  }
  getDataCheckFuncs(tableName){
    var DataCheckFuncs={
      "meals": [this.nameCheck, this.nameCheck, this.mealType, this.notNegIntNumberCheck],
      "ingredients": [this.yesNoCheck, this.notNegIntNumberCheck, this.nameCheck, this.notNegIntNumberCheck, this.notNegFloatCheck],
      "cooks": [this.FIOCheck, this.MGCheck, this.notNegIntNumberCheck, this.inaccessibilityCheck, this.datetimeCheck, this.dateCheck]
    }
    return DataCheckFuncs[tableName];
  }

  constructor(){
    if(DBWorker.#Instance==null){
        DBWorker.#Instance=this;
    }
  }

  static getInstance(){
    if(DBWorker.#Instance==null){
        new DBWorker();
    }
    return DBWorker.#Instance;
  }
}

module.exports = {DBWorker}