interface Validatable {
    value: number | string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundfn = originalMethod.bind(this);
            return boundfn;
        },
    };
    return adjDescriptor;
}

function validate(validatableInput: Validatable) {
    let isValid = true;

    if (validatableInput.required) {
        isValid =
            isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (
        validatableInput.minLength != null &&
        typeof validatableInput.value === "string"
    ) {
        isValid =
            isValid &&
            validatableInput.value.length >= validatableInput.minLength;
    }
    if (
        validatableInput.maxLength != null &&
        typeof validatableInput.value === "string"
    ) {
        isValid =
            isValid &&
            validatableInput.value.length <= validatableInput.maxLength;
    }
    if (
        validatableInput.min != null &&
        typeof validatableInput.value === "number"
    ) {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (
        validatableInput.max != null &&
        typeof validatableInput.value == "number"
    ) {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}

class ProjectState {
    private listeners: any[] = [];
    private projects: any[] = [];
    private static instance: ProjectState;

    private constructor() {}

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        return (this.instance = new ProjectState());
    }

    addListener(listenerFn: Function) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, numOfpeople: number) {
        const newProject = {
            id: Math.random().toString(),
            title: title,
            description: description,
            people: numOfpeople,
        };
        this.projects.push(newProject);

        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    assignedProjects: any[];

    constructor(private type: "active" | "finished") {
        this.templateElement = document.getElementById(
            "project-list"
        )! as HTMLTemplateElement;
        this.hostElement = document.getElementById("app")! as HTMLDivElement;
        const importedNode = document.importNode(
            this.templateElement.content,
            true
        );
        this.assignedProjects = [];

        this.element = importedNode.firstElementChild as HTMLElement;
        this.element.id = `${this.type}-projects`;

        projectState.addListener((projects: any[]) => {
            this.assignedProjects = projects;
            this.renderedProjects();
        });
        this.attach();
        this.renderContent();
    }

    private renderedProjects() {
        const listEL = document.getElementById(
            `${this.type}-projects-list`
        )! as HTMLUListElement;
        for (const prjItem of this.assignedProjects) {
            const listItem = document.createElement("li");
            listItem.textContent = prjItem.title;
            listEL.appendChild(listItem);
        }
    }

    private renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul")!.id = listId;
        this.element.querySelector("h2")!.textContent =
            this.type.toUpperCase() + " PROJECTS";
    }

    private attach() {
        this.hostElement.insertAdjacentElement("beforeend", this.element);
    }
}

class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.templateElement = document.getElementById(
            "project-input"
        )! as HTMLTemplateElement;
        this.hostElement = document.getElementById("app")! as HTMLDivElement;

        const importedNode = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = importedNode.firstElementChild! as HTMLFormElement;
        this.element.id = "user-input";

        this.titleInputElement = this.element.querySelector(
            "#title"
        )! as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector(
            "#description"
        )! as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector(
            "#people"
        )! as HTMLInputElement;

        this.configure();
        this.attach();
    }

    private getUserInput(): [string, string, number] | void {
        const titleInput = this.titleInputElement.value;
        const descriptionInput = this.descriptionInputElement.value;
        const peopleInput = this.peopleInputElement.value;

        const titleValidatable: Validatable = {
            value: titleInput,
            required: true,
        };

        const descriptionValidatable: Validatable = {
            value: descriptionInput,
            required: true,
            minLength: 5,
        };

        const peopleValidatable: Validatable = {
            value: peopleInput,
            required: true,
            min: 1,
            max: 4,
        };

        if (
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)
        ) {
            alert("Invalid input. Please enter a valid input!");
            return;
        } else {
            return [titleInput, descriptionInput, +peopleInput];
        }
    }

    private clearUserInput() {
        this.titleInputElement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.getUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, peopleNum] = userInput;
            projectState.addProject(title, description, peopleNum);
            this.clearUserInput();
        }
    }

    private configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }

    private attach() {
        this.hostElement.insertAdjacentElement("afterbegin", this.element);
    }
}

const prjInput = new ProjectInput();
const activePrj = new ProjectList("active");
const finishedPrj = new ProjectList("finished");
