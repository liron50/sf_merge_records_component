import { LightningElement, track, api, wire } from 'lwc';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getMainRecord from '@salesforce/apex/MergeRecordsController.getMainRecord';
import mergeRecords from '@salesforce/apex/MergeRecordsController.mergeRecords';

export default class MergeRecordsComp extends LightningElement {

    @api recordId;
    @api objectApiName;

    @track objectInfo;

    @track mainRecord;
    @track secondRecordId;
    @track secondRecord;

    @track showFieldsTable;
    @track mergeRelatedList;

    @track helpText;

    @track fieldData = [];

    
    @wire(getObjectInfo, {objectApiName : '$objectApiName'}) objectInfo;

    connectedCallback(){
        this.showFieldsTable = false;
        this.mergeRelatedList = false;

        getMainRecord({recordId: this.recordId}).then(
            result => {
                this.mainRecord = result;
            }
        ).catch(error => {
            console.log('error: ' + error);
        });
    }

    secondRecordSelected (event){

        this.secondRecordId = event.detail.selectedRecordId;

        if(this.secondRecordId === null){
            this.secondRecord = null;
            this.showFieldsTable = false;
            this.fieldData = [];
        }
        else{
            getMainRecord({recordId: this.secondRecordId}).then(
                result => {
                    this.secondRecord = result;
                    this.showFieldsTable = true;
                    this.helpText = 'Click on the fields from ' + this.secondRecord.Name + 'that should be updated into ' + this.mainRecord.Name;
                    
                    for(var fIndex in this.objectInfo.data.fields){
                        this.fieldData.push({
                            'fName' : this.objectInfo.data.fields[fIndex].apiName,
                            'status': 'rec1',
                            'rec1Style': this.objectInfo.data.fields[fIndex].updateable ? 'fieldCell cursorCell' : 'fieldCell', 
                            'rec2Style': this.objectInfo.data.fields[fIndex].updateable ? 'fieldCell cursorCell' : 'fieldCell',
                            'isUpdateable': this.objectInfo.data.fields[fIndex].updateable
                        });
                    }
                }
            ).catch(error => {
                console.log('error: ' + error);
            });
        }
    }

    includeRelatedListSwitch(){
        this.mergeRelatedList = ! this.mergeRelatedList;
    }

    cellClickedFunction(event){

        var clickedField = event.currentTarget.dataset.field;
        var clickedRec = event.currentTarget.dataset.rec;

        for(var itemField in this.fieldData){
            if(this.fieldData[itemField].isUpdateable == true 
                && this.fieldData[itemField].fName === clickedField){

                this.fieldData[itemField].status = clickedRec;
                this.fieldData[itemField].rec2Style = clickedRec == 'rec2' ? 'hightlightCell fieldCell cursorCell' : 'fieldCell cursorCell';
            }
        }
    }
    

    mergeRecords(){
        for(var fIndex in this.fieldData){
            if(this.fieldData[fIndex].status == 'rec2'){
                this.mainRecord[this.fieldData[fIndex].fName] = this.secondRecord[this.fieldData[fIndex].fName]
            }
        }

        mergeRecords({'newRecord': this.mainRecord, 'secondRecordId' : this.secondRecordId, 'mergeRelatedList' : this.mergeRelatedList}).then(
            result => {
                if(result){
                    this.dispatchEvent( new ShowToastEvent({
                        title : 'Error',
                        message: result,
                        variant: 'error'}));
                }
                else{
                    this.dispatchEvent( new ShowToastEvent({
                        title : 'Success',
                        message: 'Accounts merged successfully.',
                        variant: 'success'}));

                    this.secondRecord = null;
                    this.showFieldsTable = false;
                    this.fieldData = [];

                    getRecordNotifyChange([{recordId: this.recordId}]);
                }
            }
        ).catch(error => {
            console.log('error: ' + error);
        });
    }

    cancelMerge(){
        this.showFieldsTable = false;
    }
}