public with sharing class MergeRecordsController {

    
    @AuraEnabled
    public static sObject getMainRecord(Id recordId){
        
        Schema.DescribeSObjectResult dsr = recordId.getSObjectType().getDescribe();
        
        String sObjectName =  dsr.getName();

        String soqlQuery = 'select ';

        for(Schema.SObjectField field : dsr.fields.getMap().values()){
            soqlQuery += field.getDescribe().getName() + ',';
        }

        soqlQuery = soqlQuery.removeEnd(',') + ' from ' + sObjectName + ' where Id = \'' + recordId + '\'';

        sObject mainRecord = Database.query(soqlQuery);

        return mainRecord;
    }

    @AuraEnabled
    public static String mergeRecords(sObject newRecord, String secondRecordId, boolean mergeRelatedList){

        String retMsg = '';

        try{
            map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();

            update newRecord;

            if(mergeRelatedList){
                Schema.DescribeSObjectResult dsr = newRecord.Id.getSObjectType().getDescribe();

                for(Schema.ChildRelationship childRelation : dsr.getChildRelationships()){

                    System.debug('getChildSObject:: ' + childRelation.getChildSObject());

                    if(schemaMap.containsKey(childRelation.getChildSObject().getDescribe().getName())){
                        if(childRelation.getChildSObject().getDescribe().fields.getMap().get(String.valueOf(childRelation.getField())).getDescribe().isUpdateable()){
                            String soqlChildRecords = 'select Id from ' + String.valueOf(childRelation.getChildSObject()) + ' where ' + childRelation.getField() +' =\'' + secondRecordId + '\'';

                            list<sObject> childRecords = Database.query(soqlChildRecords);

                            if(! childRecords.isEmpty()){
                                for(sObject rec : childRecords){
                                    rec.put(childRelation.getField(), newRecord.Id);
                                }

                                update childRecords;
                            }
                        }
                    }
                }
            }

            //Delete the merged record
            sObject recordToDelete = ((Id)secondRecordId).getSObjectType().newSobject();
            recordToDelete.Id = secondRecordId;
            delete recordToDelete;
        }
        catch(Exception ex){
            retMsg = 'Error occur: ' + ex.getMessage() + '. Details: ' + ex.getStackTraceString();
        }
        return retMsg;
    }
}