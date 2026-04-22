import inquirer from 'inquirer';

export async function showMainMenu() {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Choose an option:',
      choices: ['Red Team', 'Blue Team', 'Exit'],
    },
  ]);

  return answer.option;
}