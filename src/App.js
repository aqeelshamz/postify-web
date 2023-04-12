import React, { useState } from "react";
import HeaderArea from "./components/HeaderArea";
import RequestArea from "./components/RequestArea";
import ResponseArea from "./components/ResponseArea";
import History from "./components/History";
import RequestInputArea from "./components/RequestInputArea";
import { makeApiCall } from "./components/functions/makeApiCall";
import prettier from "prettier/standalone";
import parserHtml from "prettier/parser-html";

function App() {
  const [endpoint, setEndpoint] = React.useState({
    url: "",
    method: "GET",
    headers: "",
    params: "",
    body: {},
    contentType: "",
  });

  const [responseData, setResponseData] = useState({
    data: "",
    lang_type: "",
    status: 200,
    size: null,
    time: null,
  });

  const [Loading, setLoading] = useState(false);

  const handleSubmitRequest = async () => {
    setLoading(true);
    let startTime = null;
    let endTime = null;
    let responseSize = "-";
    try {
      startTime = Date.now();
      const response = await makeApiCall(endpoint);
      endTime = Date.now();

      const contentType = response.headers["content-type"];
      responseSize = (
        new TextEncoder().encode(JSON.stringify(response.data)).length / 1024
      ).toFixed(2);

      let stringValue;
      if (contentType.includes("json")) {
        stringValue = JSON.stringify(response.data, null, 2);
      } else if (contentType.includes("html")) {
        stringValue = prettier.format(response.data, {
          parser: "html",
          plugins: [parserHtml],
        });
      } else if (contentType.includes("xml")) {
        stringValue = prettier.format(response.data, { parser: "xml" });
      } else if (contentType.includes("javascript")) {
        stringValue = prettier.format(response.data, { parser: "babel" });
      } else {
        stringValue = prettier.format(response.data, { parser: "text" });
      }

      setResponseData({
        data: stringValue,
        lang_type: contentType.split(";")[0].split("/")[1], //? "json" or "html" or "xml" or "javascript" or "plain"
        status: response.status,
        time: endTime - startTime, // time taken to receive response in milliseconds
        size: responseSize, // size of the response in bytes
      });

      const endpointList = JSON.parse(localStorage.getItem("endpoints")) || [];
      const exists = endpointList.some(
        (e) => e.url === endpoint.url && e.method === endpoint.method
      );
      if (!exists) {
        endpointList.push(endpoint);
        localStorage.setItem("endpoints", JSON.stringify(endpointList));
      }
    } catch (error) {
      setResponseData({
        data: JSON.stringify(error, null, 2),
        lang_type: "json",
        status: error.response?.status || "Error",
        time: Date.now() - startTime,
        size: responseSize,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <HeaderArea />
      <RequestArea
        endpoint={endpoint}
        setEndpoint={setEndpoint}
        handleSubmit={handleSubmitRequest}
      />
      <History />
      <RequestInputArea endpoint={endpoint} setEndpoint={setEndpoint} />
      <ResponseArea responseData={responseData} Loading={Loading} />
    </div>
  );
}

export default App;
