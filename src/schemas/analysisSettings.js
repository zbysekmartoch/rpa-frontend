import { translations } from '../i18n/translations.js';

export const getAnalysisSettingsSchema = (language = 'cz') => {
  const t = (key) => translations[language]?.[key] || translations.cz[key] || key;
  
  return {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": t('analysisSettingsTitle'),
    "type": "object",
    "required": ["dateFrom", "dateTo", "basketId"],
    "properties": {
      "dateFrom": { 
        "type": "string", 
        "format": "date", 
        "title": t('periodFrom')
      },
      "dateTo": { 
        "type": "string", 
        "format": "date", 
        "title": t('periodTo')
      },
      "basketId": {
        "type": "number",
        "title": t('basket'),
        "description": t('basketDescription')
      },
      "workflow": {
        "type": "string",
        "title": t('scriptSequence'),
        "description": t('workflowDescription')
      }
    },
    "additionalProperties": false
  };
};

export const getAnalysisSettingsUiSchema = (language = 'cz') => {
  const t = (key) => translations[language]?.[key] || translations.cz[key] || key;
  
  return {
    "ui:order": ["dateFrom", "dateTo", "basketId", "workflow"],
    dateFrom: { 
      "ui:widget": "date", 
      "ui:help": t('dateFromHelp')
    },
    dateTo: { 
      "ui:widget": "date", 
      "ui:help": t('dateToHelp')
    },
    basketId: { 
      "ui:widget": "select", 
      "ui:placeholder": t('selectBasketPlaceholder')
    },
    workflow: {
      "ui:widget": "WorkflowWidget",
      "ui:options": {
        rows: 20
      },
      "ui:help": t('workflowHelp')
    }
  };
};