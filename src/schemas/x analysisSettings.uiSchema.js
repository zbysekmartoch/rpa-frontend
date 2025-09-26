const uiSchema = {
  "ui:order": ["dateFrom", "dateTo", "basketId", "workflow"],
  dateFrom: { "ui:widget": "date", "ui:help": "První den období" },
  dateTo:   { "ui:widget": "date", "ui:help": "Poslední den období" },
  basketId: { "ui:widget": "select", "ui:placeholder": "Vyber košík" },
  workflow: {
    "ui:widget": "textarea",
    "ui:options": {
        rows: 20
    }
  }
};

export default uiSchema;