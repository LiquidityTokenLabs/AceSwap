module.exports = [
  {
    type: 'select',
    name: 'atomic',
    message: 'select directory',
    choices: ['atoms', 'molecules', 'organisms', 'templates', 'pages'],
  },
  {
    type: 'input',
    name: 'component_name',
    message: 'input component name',
    validate: (input) => input !== '',
  },
  {
    type: 'confirm',
    name: 'require_test',
    message: 'need test file？',
  },
];