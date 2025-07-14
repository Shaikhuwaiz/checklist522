// Checklist.tsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const ChecklistForm = () => {
  const [form, setForm] = useState({
    SO: "",
    CorrectOrder: "",
    shipDate: "",
    shipMethod: "",
    shipVia: "",
    correctPO: "",
    correctshiptoaddress: "",
    specialins: "",
    checkStock: "NA",
    backorder: "NA",
    pricematch: "",
    logosize: "NA",
    bucketorder: "NA",
    ComponentArt: "",
    hangtags: "NA",
    colorpdf: "",
    oecsr: "",
  });

  const [tapes, setTapes] = useState([{ prefix: "", code: "" }]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleTapeChange = (index: number, field: string, value: string) => {
    const updated = [...tapes];
    updated[index][field] = value;
    setTapes(updated);
  };

  const addTape = () => setTapes([...tapes, { prefix: "", code: "" }]);
  const removeTape = (index: number) =>
    setTapes(tapes.filter((_, i) => i !== index));

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Outsourcing OE Checklist – DOMESTIC", 10, 10);

    doc.setFontSize(12);
    doc.text(`• SO #: ${form.SO}`, 10, 20);
    doc.text(`• Correct Order #: ${form.CorrectOrder}`, 10, 30);
    doc.text(`• Correct PO #: ${form.correctPO}`, 10, 40);
    doc.text(`• Shipping Method: ${form.shipMethod}`, 10, 50);
    doc.text(`• Shipping Via: ${form.shipVia}`, 10, 60);
    doc.text(`• Correct Ship Date: ${form.shipDate}`, 10, 70);
    doc.text(`• Correct Ship To Address: ${form.correctshiptoaddress}`, 10, 80);
    doc.text(`• Special Instructions: ${form.specialins}`, 10, 90);
    doc.text(`• Check Available Stock: ${form.checkStock}`, 10, 100);
    doc.text(`• Backorders on separate SO: ${form.backorder}`, 10, 110);
    doc.text(`• Price Matches ACE: ${form.pricematch}`, 10, 120);

    const combinedTapes = tapes
      .filter((tape) => tape.prefix || tape.code)
      .map((tape) => `${tape.prefix}${tape.code}`)
      .join(" / ");
    doc.text(`• Tape/Component: ${combinedTapes}`, 10, 130);
    doc.text(`• Logo Size / Tolerance for Item: ${form.logosize}`, 10, 140);
    doc.text(`• Bucket order with band: ${form.bucketorder}`, 10, 150);
    doc.text(`• Component Art: ${form.ComponentArt}`, 10, 160);
    doc.text(`• Labels / Hang Tags: ${form.hangtags}`, 10, 170);
    doc.text(`• Color PDF/Component art uploaded: ${form.colorpdf}`, 10, 180);

    // Now define and use doc here
    const text = `* OE CSR ${form.oecsr}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, 190);

    doc.save(`Checklist_CC_${form.SO}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-md rounded-md mt-10">
      <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
        Outsourcing OE Checklist – DOMESTIC
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input fields */}
        {[
          { label: "SO #", id: "SO" },
          { label: "Correct Order #", id: "CorrectOrder" },
          { label: "Correct PO", id: "correctPO" },
          { label: "Shipping Method", id: "shipMethod" },
          { label: "Shipping Via", id: "shipVia" },
          { label: "Ship To Address", id: "correctshiptoaddress" },
          { label: "Price Match", id: "pricematch" },
          { label: "Logo Size", id: "logosize" },
          { label: "Bucket Order", id: "bucketorder" },
          { label: "Component Art", id: "ComponentArt" },
          { label: "Hangtags", id: "hangtags" },
          { label: "Color PDF", id: "colorpdf" },
          { label: "OE CSR", id: "oecsr" },
        ].map((field) => (
          <div key={field.id} className="flex flex-col">
            <label htmlFor={field.id} className="font-semibold text-sm mb-1">
              {field.label}
            </label>
            <input
              id={field.id}
              value={(form as any)[field.id]}
              onChange={handleChange}
              className="border p-2 rounded-md"
            />
          </div>
        ))}

        {/* Date */}
        <div className="flex flex-col">
          <label className="font-semibold text-sm mb-1">Ship Date</label>
          <DatePicker
            selected={form.shipDate ? new Date(form.shipDate) : null}
            onChange={(date) =>
              setForm((prev) => ({
                ...prev,
                shipDate: date ? format(date, "MM-dd-yyyy") : "",
              }))
            }
            dateFormat="MM-dd-yyyy"
            placeholderText="Select Date"
            className="border p-2 rounded-md"
          />
        </div>
      </div>

      {/* Tape List */}
      <div className="mt-6">
        <label className="font-semibold">Tape/Component List:</label>
        {tapes.map((tape, index) => (
          <div key={index} className="flex gap-2 my-2">
            <input
              type="text"
              value={tape.prefix}
              placeholder="Prefix"
              onChange={(e) =>
                handleTapeChange(index, "prefix", e.target.value)
              }
              className="border p-2 w-1/4 rounded-md"
            />
            <input
              type="text"
              value={tape.code}
              placeholder="Code"
              onChange={(e) => handleTapeChange(index, "code", e.target.value)}
              className="border p-2 w-1/2 rounded-md"
            />
            {tapes.length > 1 && (
              <button
                onClick={() => removeTape(index)}
                className="text-red-600 hover:underline"
              >
                ❌
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTape}
          className="mt-2 text-blue-600 hover:underline"
        >
          ➕ Add Tape
        </button>
      </div>

      {/* Download Button */}
      <div className="text-center mt-8">
        <button
          onClick={generatePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
        >
          📄 Download Checklist CC# {form.SO}
        </button>
      </div>
    </div>
  );
};

export default ChecklistForm;
