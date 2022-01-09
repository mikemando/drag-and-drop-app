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

enum ProjectStatus {
    Finished,
    Active,
}

type Listener<T> = (items: T[]) => void;

class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ) {}
}

class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        return (this.instance = new ProjectState());
    }

    addListener(listenerFn: Listener<Project>) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, numOfpeople: number) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            numOfpeople,
            ProjectStatus.Active
        );

        this.projects.push(newProject);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
        templateId: string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId?: string
    ) {
        this.templateElement = document.getElementById(
            templateId
        )! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;
        const importedNode = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = importedNode.firstElementChild as U;

        if (newElementId) {
            this.element.id = newElementId;
        }

        this.attach(insertAtStart);
    }

    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(
            insertAtStart ? "afterbegin" : "beforeend",
            this.element
        );
    }

    abstract configure(): void;
    abstract renderContent(): void;
}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
    private project: Project;

    constructor(hostId: string, project: Project) {
        super("single-project", hostId, false, project.id);
        this.project = project;

        this.configure();
        this.renderContent();
    }

    configure() {}

    renderContent() {
        this.element.querySelector("h2")!.textContent = this.project.title;
        this.element.querySelector("h3")!.textContent =
            this.project.people.toString();
        this.element.querySelector("p")!.textContent = this.project.description;
    }
}

class ProjectList extends Component<HTMLDivElement, HTMLElement> {
    assignedProjects: Project[];

    constructor(private type: "active" | "finished") {
        super("project-list", "app", false, `${type}-projects`);

        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    private renderedProjects() {
        const listEL = document.getElementById(
            `${this.type}-projects-list`
        )! as HTMLUListElement;
        listEL.innerHTML = "";
        for (const prjItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
        }
    }

    configure() {
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter((project) => {
                if (this.type === "active") {
                    return (project.status = ProjectStatus.Active);
                }
                return (project.status = ProjectStatus.Finished);
            });
            this.assignedProjects = relevantProjects;
            this.renderedProjects();
        });
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul")!.id = listId;
        this.element.querySelector("h2")!.textContent =
            this.type.toUpperCase() + " PROJECTS";
    }
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super("project-input", "app", true, "user-input");

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
    }

    configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }

    renderContent() {}

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
}

const prjInput = new ProjectInput();
const activePrj = new ProjectList("active");
const finishedPrj = new ProjectList("finished");
