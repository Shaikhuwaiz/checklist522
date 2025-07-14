import { useState } from "react";
import jsPDF from "jspdf";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const ChecklistForm = () => {
  const [form, setForm] = useState({
    SO: "",
    CorrectOrder: "",
    correctPO: "",
    correctshiptoaddress: "",
    shipDate: "",
    shipMethod: "",
    shipVia: "",
    specialins: "",
    checkStock: "NA",
    backorder: "NA",
    pricematch: "",
    logosize: "NA",
    bucketorder: "NA",
    ComponentArt: "",
    hangtags: "NA",
    colorpdf: "",
    oecsr: "OWAIZ",
  });

  const [tapes, setTapes] = useState<Tape[]>([{ prefix: "", code: "" }]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };
  type Tape = {
    prefix: string;
    code: string;
  };

  const handleTapeChange = (
    index: number,
    field: keyof Tape,
    value: string
  ) => {
    const updated = [...tapes];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setTapes(updated);
  };

  const addTape = () => setTapes([...tapes, { prefix: "", code: "" }]);
  const removeTape = (index: number) => {
    const updated = tapes.filter((_, i) => i !== index);
    setTapes(updated);
  };
  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text("Outsourcing OE Checklist – DOMESTIC", 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`SO #: ${form.SO}`, 10, y);
    y += 10;
    doc.text("ORDER ENTRY", 10, y);
    y += 10;

    doc.text(`• Correct Order #: ${form.CorrectOrder}`, 10, y);
    y += 10;
    doc.text(`• Correct PO: ${form.correctPO}`, 10, y);
    y += 10;
    doc.text(`• Correct Ship to address: ${form.correctshiptoaddress}`, 10, y);
    y += 10;
    doc.text(`• Correct Ship Date: ${form.shipDate}`, 10, y);
    y += 10;
    doc.text(`• Correct Ship Method & Terms: ${form.shipMethod}`, 10, y);
    y += 10;
    doc.text(`• Shipping Via: ${form.shipVia}`, 10, y);
    y += 10;
    doc.text(`• Special Instructions: ${form.specialins}`, 10, y);
    y += 10;
    doc.text(`• Check available stock: ${form.checkStock}`, 10, y);
    y += 10;
    doc.text(
      `• Backorders are placed on separate SO: ${form.backorder}`,
      10,
      y
    );
    y += 10;
    doc.text(`• Price Matches ACE order copy: ${form.pricematch}`, 10, y);
    y += 10;

    doc.text(
      `• Correct tape/component: ${tapes
        .map((tape) => `${tape.prefix}${tape.code}`)
        .join(" / ")}`,
      10,
      y
    );
    y += 10;
    doc.text(`• Logo Size / Tolerance for Item: ${form.logosize}`, 10, y);
    y += 10;
    doc.text(`• Bucket order with band: ${form.bucketorder}`, 10, y);
    y += 10;
    doc.text(`• Component Art: ${form.ComponentArt}`, 10, y);
    y += 10;
    doc.text(`• Labels / Hang Tags: ${form.hangtags}`, 10, y);
    y += 10;
    doc.text(
      `• Color PDF/Component art uploaded to NetSuite: ${form.colorpdf}`,
      10,
      y
    );
    y += 20;

    const pageWidth = doc.internal.pageSize.getWidth();
    const text = `* OE CSR ${form.oecsr}`;
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);

    doc.save(`Checklist_CC#_${form.SO}.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-md">
      <h2 className="text-xl font-bold mb-4">
        Outsourcing OE Checklist – DOMESTIC
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "SO #", id: "SO" },
          { label: "Correct Order #", id: "CorrectOrder" },
          { label: "Correct Ship Date", id: "shipDate", type: "date" },
          { label: "Shipping Method & Terms", id: "shipMethod" },
          { label: "Correct PO", id: "correctPO" },
          { label: "Correct Ship to address", id: "correctshiptoaddress" },
          { label: "Special Instructions", id: "specialins", type: "select" },
          { label: "Shipping Via", id: "shipVia" },

          { label: "Check Available Stock", id: "checkStock", type: "select" },
          {
            label: "Backorders on Separate SO",
            id: "backorder",
            type: "select",
          },
          { label: "Price Match with ACE", id: "pricematch", type: "select" },
          <div className="mt-6">
          <label className="font-semibold">Tape/Component List:</label>
          {tapes.map((tape, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <input
                type="text"
                value={tape.prefix}
                placeholder="Prefix"
                onChange={(e) =>
                  handleTapeChange(index, "prefix", e.target.value)
                }
                className="border p-2 w-1/4 rounded"
              />
              <input
                type="text"
                value={tape.code}
                placeholder="Code"
                onChange={(e) => handleTapeChange(index, "code", e.target.value)}
                className="border p-2 w-2/4 rounded"
              />
              {tapes.length > 1 && (
                <button
                  onClick={() => removeTape(index)}
                  className="text-red-500"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          <button onClick={addTape} className="text-blue-600 mt-2">
            ➕ Add Tape
          </button>
        </div>
          { label: "Logo Size / Tolerance", id: "logosize", type: "select" },
          {
            label: "Bucket Order with Band",
            id: "bucketorder",
            type: "select",
          },
          { label: "Component Art", id: "ComponentArt", type: "select" },
          { label: "Labels / Hang Tags", id: "hangtags", type: "select" },
          {
            label: "Color PDF/Component art uploaded to NetSuite",
            id: "colorpdf",
            type: "select",
          },
          { label: "OE CSR", id: "oecsr", type: "select", options: ["OWAIZ"] },
        ].map((field) => (
          <div key={field.id} className="flex flex-col">
            <label htmlFor={field.id} className="text-sm font-medium mb-1">
              {field.label}
            </label>
            {field.type === "select" ? (
              <select
                id={field.id}
                value={(form as any)[field.id]}
                onChange={handleChange}
                className="border border-gray-300 rounded p-2"
              >
                <option value="">-- Select --</option>
                {(field.options ?? ["NA", "YES"]).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "date" ? (
              <DatePicker
                selected={
                  (form as any)[field.id]
                    ? new Date((form as any)[field.id])
                    : null
                }
                onChange={(date) =>
                  setForm((prev) => ({
                    ...prev,
                    [field.id]: date ? format(date, "MM-dd-yyyy") : "",
                  }))
                }
                dateFormat="MM-dd-yyyy"
                placeholderText="Select Date"
                className="border border-gray-300 rounded p-2"
              />
            ) : (
              <input
                id={field.id}
                value={(form as any)[field.id]}
                onChange={handleChange}
                className="border border-gray-300 rounded p-2"
              />
            )}
          </div>
        ))}
      </div>

      {/* Tapes */}
   

      <div className="text-center mt-6">
        <button
          onClick={generatePDF}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          📄 Download Checklist CC# {form.SO}
        </button>
      </div>
    </div>
  );
};

export default ChecklistForm;
