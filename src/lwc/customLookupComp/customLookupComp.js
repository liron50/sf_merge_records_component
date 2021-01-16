import { LightningElement, api, track, wire } from 'lwc';

import findRecords from '@salesforce/apex/CustomLookupController.findRecords';

 
export default class CustomLookupComp extends LightningElement {

    @track recordsList;
    @track searchKey = "";
    @api selectedValue;
    @api selectedRecordId;
    @api objectApiName;
    @api iconName;
    @api lookupLabel;
    @track message;

    onLeavue(event){
        console.log('onLeavue:: ');

        setTimeout(() => {
            this.searchKey = "";
            this.recordsList = null;
        }, 300);
    }

    onRecordSelection(event){
        console.log('onRecordSelection:: ');

        this.selectedRecordId = event.target.dataset.key;
        this.selectedValue = event.target.dataset.name;
        this.searchKey = "";
        this.onSelectedRecordUpdate();
    }

    handleKeyChange(event){
        console.log('handleKeyChange:: ');

        const searchKey = event.target.value;
        this.searchKey = searchKey;
        this.getLookupResult();
    }

    removeRecordOnLookup(event){
        console.log('removeRecordOnLookup:: ');

        this.searchKey = "";
        this.selectedValue = null;
        this.selectedRecordId = null;
        this.recordsList = null;
        this.onSelectedRecordUpdate();
    }

    onSelectedRecordUpdate(){
        console.log('onSelectedRecordUpdate:: ');

        const passEventr = new CustomEvent('recordselection', {detail: {selectedRecordId: this.selectedRecordId, selectedValue: this.selectedValue}});
        this.dispatchEvent(passEventr);
    }

    getLookupResult(){
        console.log('getLookupResult:: ');

        findRecords({searchKey: this.searchKey, objectName: this.objectApiName}).
            then((result) => {
                console.log('result:: ' + result);

                if(result.length === 0){
                    this.recordsList = [];
                    this.message = "No records were found";
                }
                else{
                    this.recordsList = result;
                    this.message = "";
                }
            }).catch((error) => {
                this.error = error;
                this.recordsList = undefined;
                console.log('error:: ' + error);
            });
    }
}