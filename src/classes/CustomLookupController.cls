public with sharing class CustomLookupController {

    @AuraEnabled (cacheable=true)
    public static list<sObject> findRecords(String searchKey, String objectName){
        String searchText = '\'' + String.escapeSingleQuotes(searchKey) + '%\'';

        return Database.query('select Id,Name from ' + objectName + ' where Name like ' + searchText + ' limit 20');

    }
}