import { TapGoCommandExecutionArgument } from "./tapgo-command-execution-argument";

export interface TapGoCommand {
    name: string;
    description: string;
    executionArgument: TapGoCommandExecutionArgument;
    hideMainWindowAfterExecution: boolean;
}
