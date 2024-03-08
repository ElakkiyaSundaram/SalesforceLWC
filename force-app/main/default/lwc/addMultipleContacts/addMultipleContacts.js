import { LightningElement,api, track,wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';

import CONTACT_OBJECT from '@salesforce/schema/Contact'
import GENDER_IDENTITY_FIELD from '@salesforce/schema/Contact.GenderIdentity'
import saveMultipleContacts from '@salesforce/apex/addMultipleContactsController.saveMultipleContacts';


export default class AddMultipleContacts extends LightningElement {

    @track contactRows=[];
    @api recordId;
    isLoading = false;

    @wire(getObjectInfo, {objectApiName:CONTACT_OBJECT})
        contactObjectInfo;

    @wire(getPicklistValues,{recordTypeId:'$contactObjectInfo.data.defaultRecordTypeId', fieldApiName:GENDER_IDENTITY_FIELD})
    genderPicklistValue;

    get getGenderPicklistValue(){
        return this.genderPicklistValue?.data?.values;
    }
    connectedCallback(){
        this.addNewClickHandler();
    }
    addNewClickHandler(event){
        //this.contactRows.push({tempId: Date.now()});
        this.contactRows.push({
            tempId: Date.now()
        })
    }
    deleteClickHandler(event) {
        if (this.contactRows.length == 1) {
            this.showToast('You cannot delete last contact.');
            return;
        }
        let tempId = event.target?.dataset.tempId;
        this.contactRows = this.contactRows.filter(a => a.tempId != tempId);
    }
    elementChangeHandler(event){
        let contactInputRow= this.contactRows.find(a => a.tempId==event.target.dataset.tempId);
        if(contactInputRow){
        contactInputRow[event.target.name]=event.target?.value;
        }
    }
    async submitClickHandler(event) {
        const allValid = this.checkControlsValidity();
        if (allValid) {
            this.isLoading = true;
            this.contactRows.forEach(a => a.AccountId = this.recordId);
            let response = await saveMultipleContacts({ contacts: this.contactRows });
            if (response.isSuccess) {
                this.showToast('Contacts saved successfully', 'Success', 'success');
                this.dispatchEvent(new CloseActionScreenEvent());
            }
            else {
                this.showToast('Something went wrong while saving contacts - ' + response.message);
            }
            this.isLoading = false;
        }
        else {
            this.showToast('Please correct below errors to procced further.');
        }
    }

    checkControlsValidity() {
        let isValid = true,
            controls = this.template.querySelectorAll('lightning-input,lightning-combobox');

        controls.forEach(field => {
            if (!field.checkValidity()) {
                field.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }
    showToast(message, title='Error', variant='error'){
        const event= new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
}