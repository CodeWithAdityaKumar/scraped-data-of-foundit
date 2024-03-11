const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs/promises");

const filePath = "./data/data.json";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/index.html");
});

app.get("/scrape", async (req, res) => {
  try {
    // getting the totle data
    const tDataUrl = "https://www.foundit.in/search/internship-jobs";
    const tData = await axios.get(tDataUrl);
    const $t = cheerio.load(tData.data);
    let totalData = $t("#result-count strong").text();
    console.log(totalData);

    // getting All The Data
    const scrapedData = [];
    let i = 1;

    const url = tDataUrl + "-" + i;
    const data = await axios.get(url);
    const $ = cheerio.load(data.data);

    while (i <= Math.round(totalData / 25)) {
    // while (i <=10) {
      console.log(tDataUrl + "-" + i);

      const url = tDataUrl + "-" + i;
      const data = await axios.get(url);
      const $ = cheerio.load(data.data);

      await Promise.all(
        $("div.srpLeftSection div .srpResultCardContainer").map(
          async (index, element) => {
            let jobTitle = $(element)
              .find("div.cardHead .headerContent .infoSection .jobTitle a")
              .text();
            let jobTitleUrl = $(element)
              .find("div.cardHead .headerContent .infoSection .jobTitle a")
              .attr("href");
            let companyName = $(element)
              .find(
                "div.cardHead > .headerContent > .infoSection > .companyName"
              )
              .text();
            let companyLogo = $(element)
              .find("div.cardHead .headerContent .companyLogo a img")
              .attr("src");

            let obj = {
              jobTitle: jobTitle.replaceAll("\n", "").trim(),
              jobTitleUrl: jobTitleUrl,
              jobTitleUrlData: [],
              companyName: companyName.replaceAll("\n", "").trim()  ,
              companyLogo: companyLogo,
            };

            scrapedData.push(obj);

            const data2 = await axios.get(jobTitleUrl);
            const $p = cheerio.load(data2.data);

            $p("div#jdBody").each((index, el) => {
              let Location = [];
              $p(el)
                .find(
                  "#jobHighlight > div.highlightContent > div.cardBody > .bodyRow > .details"
                )
                .each((index, el) => {
                  Location.push($p(el).text().replaceAll("\n", "").trim());
                });

              let Year = $p(el)
                .find(
                  "#jobHighlight > div.highlightContent > div > div:nth-child(2) > div.details"
                )
                .text();

              let PublishedOn = $p(el)
                .find(
                  "#jobHighlight > div.highlightContent > div > div.bodyRow.jobAnalytics > span:nth-child(1)"
                )
                .text().replaceAll("\n", "").trim();

              let TotalApplied = $p(el)
                .find(
                  "#jobHighlight > div.highlightContent > div > div.bodyRow.jobAnalytics > span:nth-child(3)"
                )
                .text().replaceAll("\n", "").trim();

              let Description = $p(el)
                .find("#jobDescription > div > div")
                .html().replaceAll("\n", "").trim();

              let JobType = [];
              $p(el)
                .find(
                  "#jobSummary > div:nth-child(2) > div.jobTypeCont > div > a"
                )
                .each((index, el) => {
                  JobType.push($p(el).text());
                });

              let Industry = [];
              $p(el)
                .find(
                  "#jobSummary > div:nth-child(3) > div.jobTypeCont > div > a"
                )
                .each((index, el) => {
                  Industry.push($p(el).text());
                });

              let Function = [];
              $p(el)
                .find(
                  "#jobSummary > div:nth-child(4) > div.jobTypeCont > div > a"
                )
                .each((index, el) => {
                  Function.push($p(el).text());
                });

              let Roles = [];
              $p(el)
                .find(
                  "#jobSummary > div:nth-child(5) > div.jobTypeCont > div > a"
                )
                .each((index, el) => {
                  Roles.push($p(el).text());
                });

              let Skills = [];
              $p(el)
                .find(
                  "#jobSummary > div:nth-child(6) > div.skillSet > div.skillDesc"
                )
                .each((index, el) => {
                  Skills.push($p(el).find("a").text());
                });

              let Education = [];
              $p(el)
                .find("#jobSummary > div:nth-child(7) > div.jobDesc ")
                .each((index, el) => {
                  Education.push($p(el).text().replaceAll("\n", "").trim());
                });

              let AboutCompany = $p(el)
                .find("#jobCompany > div.companyProfile > p")
                .text().replaceAll("\n", "").trim();

              let jobObjDAta = {
                Highlights: {
                  Location: Location,
                  Year: Year,
                  PublishedOn: PublishedOn,
                  TotalApplied: TotalApplied,
                },
                Description: Description,
                MoreInfo: {
                  JobType: JobType,
                  Industry: Industry,
                  Function: Function,
                  Roles: Roles,
                  Skills: Skills,
                  Education: Education,
                },
                AboutCompany: AboutCompany,
              };

              obj.jobTitleUrlData.push(jobObjDAta);
            });
          }
        )
      );

      i++;
    }

    const jsonString = JSON.stringify(scrapedData, null, 2); // the third argument (2) is for indentation

    fs.writeFile(filePath, jsonString, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log(`Data written to ${filePath}`);
      }
    });

    res.json({ data: scrapedData });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
