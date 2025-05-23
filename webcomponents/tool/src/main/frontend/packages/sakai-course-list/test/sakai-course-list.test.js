import "../sakai-course-list.js";
import { elementUpdated, expect, fixture, html, waitUntil } from "@open-wc/testing";
import * as data from "./data.js";
import * as courseCardData from "../../sakai-course-card/test/data.js";
import fetchMock from "fetch-mock/esm/client";

describe("sakai-course-list tests", () => {

  window.top.portal = { locale: "en_GB", siteId: data.siteId };

  fetchMock
    .get(data.i18nUrl, data.i18n, { overwriteRoutes: true })
    .get(data.courseListUrl, data.courseList, { overwriteRoutes: true })
    .get(courseCardData.i18nUrl, courseCardData.i18n, { overwriteRoutes: true })
    .get(courseCardData.toolnameMappingsUrl, courseCardData.toolnameMappings, { overwriteRoutes: true })
    .get("*", 500, { overwriteRoutes: true });

  it ("renders correctly", async () => {
 
    const el = await fixture(html`<sakai-course-list user-id="${data.userId}"></sakai-course-list>`);

    await waitUntil(() => el.sites);

    await elementUpdated(el);

    await expect(el).to.be.accessible();

    expect(el.querySelectorAll("#course-list-term-filter option").length).to.equal(3);
    expect(el.querySelectorAll("sakai-course-card").length).to.equal(3);
  });
});
