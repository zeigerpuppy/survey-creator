import * as ko from "knockout";
import * as Survey from "survey-knockout";

export interface ISurveyLogicType {
  name: string;
  baseClass: string;
  propertyName: string;
  showIf?: (survey: Survey.SurveyModel) => boolean;
}

export class SurveyLogicType {
  constructor(
    private logicType: ISurveyLogicType,
    public survey: Survey.SurveyModel
  ) {}
  public get name(): string {
    return this.logicType.name;
  }
  public get text(): string {
    return this.name;
  }
  public get baseClass(): string {
    return this.logicType.baseClass;
  }
  public get propertyName(): string {
    return this.logicType.propertyName;
  }
  public get visible(): boolean {
    return !this.logicType.showIf || this.logicType.showIf(this.survey);
  }
}

export class SurveyLogicItem {
  constructor(
    public logicType: ISurveyLogicType,
    public element: Survey.Base
  ) {}
}

export class SurveyLogic {
  public static types = [
    {
      name: "page_visibility",
      baseClass: "page",
      propertyName: "visibleIf",
      showIf: function(survey: Survey.SurveyModel) {
        return survey.pages.length > 1;
      }
    },
    {
      name: "question_visibility",
      baseClass: "question",
      propertyName: "visibleIf",
      showIf: function(survey: Survey.SurveyModel) {
        return survey.getAllQuestions().length > 0;
      }
    },
    {
      name: "panel_visibility",
      baseClass: "panel",
      propertyName: "visibleIf",
      showIf: function(survey: Survey.SurveyModel) {
        return survey.getAllPanels().length > 0;
      }
    }
  ];
  public koItems: any;
  public koMode: any;
  public logicTypes: Array<SurveyLogicType>;
  constructor(public survey: Survey.SurveyModel) {
    this.logicTypes = this.createLogicTypes();
    this.koItems = ko.observableArray();
    this.koMode = ko.observable("view");
    this.update();
  }
  public getTypeByName(name: string): SurveyLogicType {
    for (var i = 0; i < this.logicTypes.length; i++) {
      if (this.logicTypes[i].name == name) return this.logicTypes[i];
    }
    return null;
  }
  public update(survey: Survey.SurveyModel = null) {
    if (!!survey) {
      this.survey = survey;
    }
    this.koItems(this.buildItems());
    this.mode = this.items.length > 0 ? "view" : "select_type";
  }
  public get items(): Array<SurveyLogicItem> {
    return this.koItems();
  }
  /**
   * There are 3 modes: view, select_type, edit
   */
  public get mode() {
    return this.koMode();
  }
  public set mode(val: string) {
    if (
      val !== "view" &&
      val !== "select_type" &&
      val !== "new" &&
      val !== "edit"
    )
      return;
    this.koMode(val);
  }
  protected buildItems(): Array<SurveyLogicItem> {
    var res = [];
    var elements = this.getAllElements();
    for (var i = 0; i < elements.length; i++) {
      this.buildItemsByElement(elements[i], res);
    }
    return res;
  }
  protected getAllElements(): Array<Survey.Base> {
    var res = [];
    this.AddElements(this.survey.pages, res);
    this.AddElements(this.survey.getAllQuestions(), res);
    this.AddElements(this.survey.getAllPanels(), res);
    return res;
  }
  private AddElements(src: Array<any>, dest: Array<any>) {
    for (var i = 0; i < src.length; i++) {
      dest.push(src[i]);
    }
  }
  private buildItemsByElement(
    element: Survey.Base,
    dest: Array<SurveyLogicItem>
  ) {
    var types = this.getElementAllTypes(element);
    for (var i = 0; i < this.logicTypes.length; i++) {
      var lt = this.logicTypes[i];
      if (
        types.indexOf(lt.baseClass) > -1 &&
        !Survey.Helpers.isValueEmpty(element[lt.propertyName])
      ) {
        dest.push(new SurveyLogicItem(lt, element));
      }
    }
  }
  private getElementAllTypes(element: Survey.Base) {
    var types = [];
    var type = element.getType();
    types.push(type);
    while (!!type && type != "base") {
      var cl = Survey.Serializer.findClass(type);
      if (!cl) break;
      type = cl.parentName;
      if (!!type) {
        types.push(type);
      }
    }
    return types;
  }
  protected createLogicTypes(): Array<SurveyLogicType> {
    var res = [];
    for (var i = 0; i < SurveyLogic.types.length; i++) {
      res.push(new SurveyLogicType(SurveyLogic.types[i], this.survey));
    }
    return res;
  }
}
