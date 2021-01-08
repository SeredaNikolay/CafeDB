class Store{
    static #Class=new Map();
    static #QueryNames=null;
    static #DataCheckFuncForQuery=[];
    static set Class(val){
        
    }
    static get Class(){
        return Store.#Class;
    }
    #Record=new Map();
    #TableName=null;
    #TableCaption=null;
    #TableHeadings=null;
    #TableHeadingsID=null;
    #TableDefaultValues=null;
    

    #DataCheckFunc=new Map();
    static readTables(tableName){
        Store.#Class.get(tableName).readQuery(tableName);
    }
    //---------------------------------------------------------------------Добавление
    static addRecord(tableName){
        var store=Store.#Class.get(tableName);
        store.addQuery();
    }
    //---------------------------------------------------------------------Удаление
    static deleteRecord(tableName, recordID){
        var store=Store.#Class.get(tableName);
        var id=parseInt(recordID, 10);
        store.deleteQuery(id);
        store.#Record.delete(id);
    }
    //---------------------------------------------------------------------Сеттеры
    static setRecordFromViewToStore(tableName, fieldMap){
        Store.#Class.get(tableName).updateQuery(fieldMap.values());
    }
    //---------------------------------------------------------------------Получение результатов запросов
    static getQueryResult(tableName, index, data){
        Store.#Class.get(tableName).getQueryResult(index, data);
    }
    //---------------------------------------------------------------------Геттеры
    static getRecordValuesFromStoreToView(tableName, rowID){
        var row=Store.#Class.get(tableName).#Record.get(rowID);
        return Array.from(row.values());
    }
    static getRecordKeysFromStoreToView(tableName){
        var record=Store.#Class.get(tableName).#Record;
        return Array.from(record.keys());
    }
    static getFieldKeysFromStoreToView(tableName){
        var field=Store.#Class.get(tableName).#TableHeadingsID;
        return field;
    }
    static getDefaultValuesFromStoreToView(tableName){
        var defVals=Store.#Class.get(tableName).#TableDefaultValues;
        return  defVals;
    }
    //---------------------------------------------------------------------Геттеры для таблиц
    getTableNameFromStoreToView(){
        return this.#TableName;
    }
    getTableCaptionFromStoreToView(){
        return this.#TableCaption;
    }
    getTableHeadingsFromStoreToView(){
        return this.#TableHeadings;
    }
    getTableHeadingsIDFromStoreToView(){
        return this.#TableHeadingsID;
    }
    getTableDefaultValuesFromStoreToView(){
        return this.#TableDefaultValues;
    }
    //---------------------------------------------------------------------Геттеры для главной таблицы
    static getTableNameFromStoreToViewMT(){
        var values=[];
        var i=0;
        for(var aClass of Store.#Class.values()){
            values[i++]=aClass.getTableNameFromStoreToView();
        }
        return values;
    }
    static getTableCaptionFromStoreToViewMT(){
        var values=[];
        var i=0;
        for(var aClass of Store.#Class.values()){
            values[i++]=aClass.getTableCaptionFromStoreToView();
        }
        return values;
    }
    static getTableHeadingsFromStoreToViewMT(){
        var values=[];
        var i=0;
        for(var aClass of Store.#Class.values()){
            values[i++]=aClass.getTableHeadingsFromStoreToView();
        }
        return values;
    }
    static getTableHeadingsIDFromStoreToViewMT(){
        var values=[];
        var i=0;
        for(var aClass of Store.#Class.values()){
            values[i++]=aClass.getTableHeadingsIDFromStoreToView();
        }
        return values;
    }
    static getTableDefaultValuesFromStoreToViewTM(){
        var values=[];
        var i=0;
        for(var aClass of Store.#Class.values()){
            values[i++]=aClass.getTableDefaultValuesFromStoreToView();
        }
        return values;
    }
    static getQueryNames(){
        return Store.#QueryNames;
    }
    //---------------------------------------------------------------------Проверка данных
    static checkRecord(tableName, data){
        var checkFuncMap=Store.#Class.get(tableName).#DataCheckFunc;
        var checkFuncKeys=checkFuncMap.keys();
        var errCell=null;
        var errStr=null;
        var i=0;
        for(var checkFuncKey of checkFuncKeys){
            var isCorrect=checkFuncMap.get(checkFuncKey)(data[i++])
            if(!isCorrect){
                if(errCell==null)
                    errCell=new Array();
                errCell.push(i);
            }
        }
        if(errCell!=null){
            errStr="Ошибочно введены ячейки с номерами: "+errCell.join(", ");
        }
        return errStr;
    }
    static checkQuery(index, data){
        var checkFuncArr=Store.#DataCheckFuncForQuery;
        return checkFuncArr[index](data);
    }

    constructor(tableName, tableCaption=null, tableHeadings=[], tableHeadingsID=[], tableDefaultValues=[], tableCheckFunc=[], tableRecords=[]) {
        if(!Store.#Class.has(tableName)){
            Store.#Class.set(tableName, this);
            this.initTable(tableName, tableCaption, tableHeadings, tableHeadingsID, tableDefaultValues, tableCheckFunc, tableRecords);
        }
    }
    initTable(tableName, tableCaption, tableHeadings, tableHeadingsID, tableDefaultValues, tableCheckFunc, tableRecords){
        this.#TableName=tableName;
        this.#TableCaption=tableCaption;
        this.#TableHeadings=tableHeadings;
        this.#TableHeadingsID=tableHeadingsID;
        this.#TableDefaultValues=tableDefaultValues;
        for(var i=0; i<this.#TableHeadings.length; i++){
            this.#DataCheckFunc.set(this.#TableHeadingsID[i], new Function("data", tableCheckFunc[i]));
        }
        for(var i=0; i<tableRecords.length; i++){
            this.#Record.set(tableRecords[i][0], new Map());
            var recordFields=this.#Record.get(tableRecords[i][0]);
            var ind=0;
            for(var fieldKey of this.#TableHeadingsID){
                recordFields.set(fieldKey, tableRecords[i][ind++])
            }
        }
    }
    static initTables(){
        new Store("main_table", "Таблицы", ["Название"], ["name_id"], [null], [()=>{return true}]);
        $.get('/initialization', null, function(serverResponse) {
            var tableNames=serverResponse.TableNames;
            for(var i=0; i<tableNames.length; i++){
                if(!Store.#Class.has(tableNames[i]))
                    new Store(tableNames[i]);
                Store.#Class.get(tableNames[i]).readTables();
            }
            Store.#QueryNames=serverResponse.QueryNames;
            var dtChckFncs=serverResponse.DataCheckFuncs;
            for(var i=0; i<dtChckFncs.length; i++){
                Store.#DataCheckFuncForQuery[i]=new Function("data", dtChckFncs[i])
            }
        });
    }
    //---------------------------------------------------------------------Отправка и прием данных
    getQueryResult(index, data){
        var params={
            Index: index,
            Data: data
        }
        $.get('/query', params, function(serverResponse){
            var resp = serverResponse;
            var caption=resp.Caption;
            var headings=resp.Headings;
            var rows=resp.Row;
            var Inst=View.getInstance();
            Inst.updateTableCaption(caption, "queryTable");
            Inst.updateTableHeadings(headings, true, "queryTable");
            Inst.deleteChildNodes(document.getElementById("queryTableBody"));
            for(var i=0; i<rows.length; i++){
                Inst.addTableRow(rows[i], null, "queryTable");
            }
        });
    }
    readTables(){
        var params={
            TableName: this.#TableName
        }
        $.get('/read', params, function(serverResponse){
            var resp = serverResponse.Object;
            Store.#Class.get(resp.TableName).initTable(
                resp.TableName, 
                resp.TableCaption, 
                resp.TableHeadings, 
                resp.TableHeadingsID, 
                resp.TableDefaultValues, 
                resp.DataCheckFuncs, 
                resp.Records
            );
            var Inst=View.getInstance();
            Inst.setTableParams(
                "main_table",
                Store.getTableNameFromStoreToViewMT(),
                Store.getTableCaptionFromStoreToViewMT(),
                Store.getTableHeadingsFromStoreToViewMT(),
                Store.getTableHeadingsIDFromStoreToViewMT(),
                Store.getTableDefaultValuesFromStoreToViewTM()
            );
            Inst.setMainTable();
        });
    }
    updateQuery(valArr){
        var params={
            TableName: this.#TableName,
            Values: Array.from(valArr),
            TableHeadings: Array.from(this.#TableHeadingsID)
        }
        $.get('/update', params, function(serverResponse){
            var ErrMessage=serverResponse.ErrMess;
            var values=serverResponse.NewValues;
            var tableName=serverResponse.TableName;
            if(ErrMessage==""){
                var view=View.getInstance();
                var id=parseInt(values[0], 10)
                var record=Store.#Class.get(tableName).#Record.get(id);
                var i=0;
                for(var fieldKey of record.keys()){
                    record.set(fieldKey, values[i++])
                }
                view.saveEditedRow();
            }
            else
                View.errMessage(ErrMessage);
        });
    }
    addQuery(){
        var params={
            TableName: this.#TableName,
            TableHeadingsID: Array.from(this.#TableHeadingsID),
            Values: Array.from([0].concat(this.#TableDefaultValues)),           
        }
        $.get('/create', params, function(serverResponse){
            var view=View.getInstance();
            var values=serverResponse.Values;
            var tableName=serverResponse.TableName;
            var fieldKeys=serverResponse.TableHeadingsID;
            var store=Store.#Class.get(tableName);    
            var fieldMap=new Map();
            for(var i=0; i<fieldKeys.length; i++){
                fieldMap.set(fieldKeys[i], values[i])
            }
            store.#Record.set(fieldMap.values().next().value, fieldMap);
            view.addTableRow(values);
        });
    }
    deleteQuery(idVal){
        var params={
            TableName: this.#TableName,
            IdName: this.#TableHeadingsID[0],
            IdValue: idVal,           
        }
        $.post('/delete', params, null);
    }
}