class View{
    static #Instance=null;
    #ColumnCount=null;
    #SomeColumnID=null;
    #EditingRowID=null;
    #RowContent=new Array();

    #TableName=null;
    #TablesName=null;
    #TablesCaption=null;
    #TablesHeadings=null;
    #TablesHeadingsID=null;
    #TableDefaultValues=null;

    static set Instance(val){

    }
    static getInstance(){
        return View.#Instance;
    }
    static errMessage(errMess){
        alert(errMess);
    }
    //---------------------------------------------------------------------Реакциии на события
    onChangeTableButtonClick(){
        var view=View.getInstance();
        if(view.#EditingRowID==null){
            view.setMainTable();
        }else{
            alert("Сначала закончите редактирование ряда!");
        }
    }
    onAddButtonClick(){
        var view=View.getInstance();
        if(view.#EditingRowID==null){
            view.addRecordToStore();
        }else{
            alert("Сначала закончите редактирование ряда!");
        }
    }
    onEditButtonClick(){
        var view=View.getInstance();
        if(view.#EditingRowID==null){
            var id=this.parentElement.parentElement.id;
            view.#EditingRowID=id;
            view.#RowContent=view.getDataFromRow(view.#EditingRowID);//Store.getDefaultValuesFromStoreToView(view.#TableName);
            view.editTableRow(id);
        }else{
            alert("Сначала закончите редактирование другого ряда!");
        }
    }
    onDeleteButtonClick(){
        if(View.getInstance().#EditingRowID==null){
            var view=View.getInstance();
            var id=this.parentElement.parentElement.id;
            Store.deleteRecord(view.#TableName, id);
            view.deleteTableRow(id);
        }else{
            alert("Сначала закончите редактирование ряда!");
        }
    }
    onSaveButtonClick(){
        var view=View.getInstance();
        var row=view.getDataFromInputFields();
        var errMess=Store.checkRecord(view.#TableName, row);
        if(errMess==null){
            var iputVals=view.getDataFromInputFields();
            var rowValues=[view.#EditingRowID].concat(iputVals);
            view.editRecordInStore(rowValues);
        }else{
            alert(errMess);
        }
    }
    onCancelButtonClick(){
        var view=View.getInstance();
        view.canselEditedRow(view.#EditingRowID);
    }
    onQueryButtonClick(){
        var view=View.getInstance();
        var querySelect=document.getElementById("querySelect");
        var queryInputField=document.getElementById("queryInputField");
        var index=parseInt(querySelect.options[querySelect.selectedIndex].value, 10);
        var queryData=queryInputField.value;
        var tableName=view.#TableName;
        if(Store.checkQuery(index, queryData)){
            Store.getQueryResult(tableName, index, queryData);
        }else{
            alert("Ввведены недопустимые значения");
        }
    }
    //---------------------------------------------------------------------Обновление
    updateTableCaption(caption, tableID=null){
        var tCaption=tableID==null?"tableCaption":"queryTableCaption";
        document.getElementById(tCaption).textContent=caption;
    }
    updateTableHeadings(headings, noActionColumn=false, tableID=null){
        var tHead=tableID==null?"tableHead":"queryTableHead";
        var tableHead=document.getElementById(tHead);
        this.deleteChildNodes(tableHead);
        for(var i=0; i<headings.length; i++){
            this.appendElement(tableHead, "th", headings[i]);
        }
        if(!noActionColumn){
            this.appendElement(tableHead, "th", "Действие");
            View.getInstance().#ColumnCount=headings.length+1;
        }
    }
    updateRowValues(row, noActionColumn=false){
        var tr=document.getElementById(row[0]);
        this.deleteChildNodes(tr);
        for(var i=1; i<row.length; i++){
            this.appendElement(tr, "td", row[i]);
        }
        if(!noActionColumn){
            var td=document.createElement("td");
            this.addEditDeleteButtons(td);
            tr.appendChild(td);
        }
    }
    //---------------------------------------------------------------------Добавление в таблицу
    addEditDeleteButtons(td){
        this.appendElement(td, "div", "Редактировать", this.onEditButtonClick, "smallButton");
        this.appendElement(td, "div", "Удалить", this.onDeleteButtonClick, "smallButton");
    }
    addSaveCancelButtons(td){
        this.appendElement(td, "div", "Сохранить", this.onSaveButtonClick, "smallButton", "saveButton");
        this.appendElement(td, "div", "Отменить", this.onCancelButtonClick, "smallButton", "cancelButton");
    }
    addChangeTableButton(){
        this.appendElement(document.body, "div", "Сменить таблицу", this.onChangeTableButtonClick, "bigButton");
    }
    addTableTags(){
        this.appendElement(document.body, "table", null, null, null, "table");
        var table=document.getElementById("table");
        this.appendElement(table, "caption", null, null, null, "tableCaption");
        this.appendElement(table, "tr", null, null, null, "tableHead");
        this.appendElement(table, "tbody", null, null, null, "tableBody");
    }
    addAddButton(){
        this.appendElement(document.body, "div", "Добавить", this.onAddButtonClick, "bigButton");
    }
    addTableRow(rowValues, onClickFunc, tableID=null){
        var tBody=tableID==null?"tableBody":"queryTableBody"
        var clickable=onClickFunc!=null||tableID=="queryTable";
        this.appendElement(document.getElementById(tBody), "tr", null, onClickFunc, null, rowValues[0]);
        this.updateRowValues(rowValues, clickable);
    }
    //---------------------------------------------------------------------Добавление элементов для запросов
    addQueryTags(captionsForOptionsList){
        this.addQueryInputField();
        this.addQueryButton();
        this.addQuerySelectBox(captionsForOptionsList);
        this.addQueryTable();        
    }
    addQueryInputField(){
        this.appendElement(document.body, "input", null, null, "queryInputField", "queryInputField");
    }
    addQueryButton(){
        this.appendElement(document.body, "div", "Запросить", this.onQueryButtonClick, "bigButton", "queryButton");
    }
    addQuerySelectBox(captionsForOptionsList){
        this.appendElement(document.body, "select", "Пусто", null, "querySelectBox", "querySelect");
        var querySelectBox=document.getElementById("querySelect");
        for(var i=0; i<captionsForOptionsList.length; i++){
            querySelectBox.append(new Option(captionsForOptionsList[i], i));
        }      
    }
    addQueryTable(){
        var queryTable=document.getElementById("queryTable");
        this.appendElement(document.body, "table", null, null, null, "queryTable");
        var queryTable=document.getElementById("queryTable");
        this.appendElement(queryTable, "caption", null, null, null, "queryTableCaption");
        this.appendElement(queryTable, "tr", null, null, null, "queryTableHead");
        this.appendElement(queryTable, "tbody", null, null, null, "queryTableBody");
    }
    addQueryTableRow(rowValues){
        this.appendElement(document.getElementById("tableBody"), "tr", null, onClickFunc, null, rowValues[0]);
        this.updateRowValues(rowValues, true);
    }
    //---------------------------------------------------------------------Работа с хранилищем
    addRecordToStore(){
        var view=View.getInstance();
        Store.addRecord(view.#TableName);
    }
    editRecordInStore(recordValues){
        var view=View.getInstance();
        var fieldKeys=Store.getFieldKeysFromStoreToView(view.#TableName);
        var fieldMap=View.getMap(fieldKeys, recordValues);
        Store.setRecordFromViewToStore(view.#TableName, fieldMap);
    }
    //---------------------------------------------------------------------Добавление в конец
    appendElement(parent, tag, textContent=null, onClickFunc=null, aClass=null, id=null){
        var el=document.createElement(tag);
        if(textContent!=null){
            if(aClass=="inputField"){
                el.value=textContent;
            }else{
                el.textContent=textContent;
            }
        }
        if(onClickFunc!=null)
            el.onclick=onClickFunc;
        if(aClass!=null)
            el.setAttribute("class", aClass);
        if(id!=null)
            el.setAttribute("id", id);
        parent.appendChild(el);
    }
    //---------------------------------------------------------------------Удаление
    deleteChildNodes(parentNode){
        if(parentNode!=null){
            while (parentNode.firstChild!=null){
                parentNode.removeChild(parentNode.firstChild);
            }
        }
    }
    deleteClassInstances(className){
        var aClass=document.getElementsByClassName(className);
        while(aClass[0]!=null){
            aClass[0].remove();
        }
    }
    deleteTableRow(rowID){
        document.getElementById(rowID).remove();
    }
    clearPage(){
        var table=document.getElementById("table");
        var queryButton=document.getElementById("queryButton");
        var queryInputField=document.getElementById("queryInputField");
        var querySelect=document.getElementById("querySelect");
        var queryTable=document.getElementById("queryTable");
        this.deleteClassInstances("bigButton");
        table!=null?table.remove():null;
        queryInputField!=null?queryInputField.remove():null;
        queryButton!=null?queryButton.remove():null;
        querySelect!=null?querySelect.remove():null;
        queryTable!=null?queryTable.remove():null;
    }
    //---------------------------------------------------------------------Редактированиие
    editTableRow(rowID){
        var tr=document.getElementById(rowID);
        this.deleteChildNodes(tr);
        for(var i=0; i<this.#ColumnCount-1; i++){
            var td=document.createElement("td");
            this.appendElement(td, "input", this.#RowContent[i], null, "inputField");
            tr.appendChild(td);
        }
        var td=document.createElement("td");
        this.addSaveCancelButtons(td);
        tr.appendChild(td);
    }
    canselEditedRow(rowID){
        this.deleteClassInstances("inputField");
        this.setDataFromClassToRow(rowID);
    }
    saveEditedRow(){
        this.getDataFromInputRowToClass();
        this.deleteClassInstances("inputField");
        this.setDataFromClassToRow(this.#EditingRowID);
    }
    //---------------------------------------------------------------------Сеттеры
    setDataFromClassToRow(rowID){
        var row=document.getElementById(rowID);
        for(var i=0; i<row.childNodes.length-1; i++){
            row.childNodes[i].textContent=this.#RowContent[i];
        }
        var lastTD=row.lastChild;
        this.deleteChildNodes(lastTD);
        this.addEditDeleteButtons(lastTD);
        this.#RowContent=new Array();
        this.#EditingRowID=null; 
    }
    setTable(tableName, tableCaption, tableHeadings, tableHeadingsID, tableDefaulValues){
        this.clearPage();
        this.addChangeTableButton();
        this.addTableTags();
        this.addAddButton();
        this.updateTableCaption(tableCaption);
        this.updateTableHeadings(tableHeadings);
        this.#SomeColumnID=tableHeadingsID;
        this.#TableName=tableName;
        var recordKeys=Store.getRecordKeysFromStoreToView(this.#TableName);
        for(var recordKey of recordKeys){ 
            var recordValues=Store.getRecordValuesFromStoreToView(this.#TableName, recordKey);
            this.addTableRow(recordValues, null);
        }
    }
    setMainTable(){
        var tablesName=this.#TablesName, tableCaption=this.#TablesCaption, tableHeadings=this.#TablesHeadings, tableHeadingsID=this.#TablesHeadingsID, tableDefaulValues=this.#TableDefaultValues;
        this.clearPage();
        this.addTableTags();
        this.updateTableCaption(tableCaption[0]);
        this.updateTableHeadings(tableHeadings[0], true);
        for(var i=1; i<tableCaption.length; i++){
            this.addTableRow([i, tableCaption[i]], this.getFuncSetTable(tablesName[i], tableCaption[i], tableHeadings[i], tableHeadingsID[i], tableDefaulValues[i]));
            document.getElementById(i).style.textAlign="center";
        }
        this.addQueryTags(Store.getQueryNames());
        this.updateTableCaption("Ответы на запросы", "queryTable");
        this.updateTableHeadings(["Ответ"], true, "queryTable");
        this.addTableRow(["q0","Ответ"], null, "queryTable");
    }
    setTableParams(tableName, tablesName, tablesCaption, tablesHeadings, tablesHeadingsID, tableDefaulValues){
        this.#TableName=tableName;
        this.#TablesName=tablesName;
        this.#TablesCaption=tablesCaption;
        this.#TablesHeadings=tablesHeadings;
        this.#TablesHeadingsID=tablesHeadingsID;
        this.#TableDefaultValues=tableDefaulValues;
    }
    setDataFromStoreToRow(rowData){
        var row=document.getElementById(rowData[0]);
        if(row==null)
            this.addTableRow(rowData, null);
        else{
            this.#EditingRowID=rowData[0];
            for(var i=1; i<rowData.length; i++)
                this.#RowContent[i-1]=rowData[i];
            this.setDataFromClassToRow(this.#EditingRowID);
        }
    }
    //---------------------------------------------------------------------Геттеры
    static getMap(keyArr, valArr){
        var map=new Map();
        for(var i=0; i<valArr.length; i++){
            map.set(keyArr[i], valArr[i]);
        }
        return map;
    }
    getDataFromRowToClass(rowID){
        var row=document.getElementById(rowID);
        for(var i=0; i<row.childNodes.length-1; i++){
            this.#RowContent[i]=row.childNodes[i].textContent;
        } 
    }
    getDataFromInputRowToClass(){
        var row=document.getElementById(this.#EditingRowID);
        this.#RowContent[i]=new Array();
        for(var i=0; i<row.childNodes.length-1; i++){
            this.#RowContent[i]=row.childNodes[i].firstChild.value;
        } 
    }
    getFuncSetTable(tableName, tableCaption, tableHeadings, tableHeadingsID, tableDefaulValues){
        return ()=>{this.setTable(tableName, tableCaption, tableHeadings, tableHeadingsID, tableDefaulValues)};
    }
    getDataFromRowContentToStore(){
        var map=new Map();
        map.set("id", this.#EditingRowID);
        for(var i=0; i<this.#SomeColumnID.length; i++){
            map.set(this.#SomeColumnID[i], this.#RowContent[i]);
        }
        return map;
    }
    getDataFromInputFields(){
        var input=document.getElementsByClassName("inputField");
        var data=[];
        for(var i=0; i<input.length;i++){
            data[i]=input[i].value;
        }
        return data;
    }
    getDataFromRow(rowID){
        var cell=document.getElementById(rowID).childNodes;
        var data=[];
        for(var i=0; i<cell.length-1; i++){
            data[i]=cell[i].textContent;
        }
        return data;
    }

    constructor() {
        if(View.#Instance==null){
            View.#Instance=this;
        }
    }
}