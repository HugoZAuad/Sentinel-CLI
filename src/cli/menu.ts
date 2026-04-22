import inquirer from 'inquirer';

export async function showMainMenu() {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Escolha uma opção:',
      choices: ['Red Team', 'Blue Team', 'Sair'],
    },
  ]);

  return answer.option;
}