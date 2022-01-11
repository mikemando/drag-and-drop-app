/// <reference path="./components/project-input.ts"  />
/// <reference path="./components/project-list.ts" />
///

// Project Type

namespace App {
    new ProjectInput();
    new ProjectList("active");
    new ProjectList("finished");
}
