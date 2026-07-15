import jsPDF from "jspdf";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid, parse } from "date-fns";
import { Fragment, useState, useEffect, type ChangeEvent } from "react";
import Galaxy from "./components/Galaxy";

const CHECKLIST_TITLE = "Outsourcing OE Checklist - DOMESTIC";

const initialFormState = {
  SO: "",
  CorrectOrder: "",
  correctPO: "",
  correctshiptoaddress: "",
  shipDate: "",
  shipMethod: "FedEx Ground",
  shipterms: "Standard",
  specialins: "YES",
  checkStock: "NA",
  backorder: "NA",
  pricematch: "YES",
  logosize: "NA",
  bucketorder: "NA",
  ComponentArt: "YES",
  hangtags: "NA",
  colorpdf: "YES",
  oecsr: "OWAIZ",
};

type FormState = typeof initialFormState;

type FieldConfig = {
  label: string;
  id: keyof FormState;
  type?: "text" | "date" | "select";
  options?: string[];
};

const fields: FieldConfig[] = [
  { label: "SO #", id: "SO" },
  { label: "Correct Order #", id: "CorrectOrder" },
  { label: "Correct Ship Date", id: "shipDate", type: "date" },
  {
    label: "Shipping Methods & Terms",
    id: "shipMethod",
    type: "select",
    options: [
      "Air Freight",
      "Best Method",
      "Consolidation",
      "customer pickup",
      "Direct Ship",
      "Drop Ship",
      "FedEx 2Day",
      "FedEx Ground",
      "FedEx Home Delivery",
      "FedEx International Connect Plus",
      "FedEx International Economy",
      "FedEx International First",
      "FedEx International Priority",
      "FedEx express saver (3day)",
      "FedEx first overnight (by 9:30am)",
      "FedEx One Rate",
      "FedEx priority overnight (by 10:30am)",
      "Fedex priority overnight saturday delivery (by 12pm)",
      "FedEx standard overnight (by 5pm)",
      "Hold for Release",
      "In House delivery",
      "Ocean Freight",
      "See Route Guide",
      "Truck",
      "UPS 2nd Day",
      "Ups 3Day Select",
      "UpS expedited",
      "UPS Ground",
      "UPS Next Day (by 12pm)",
      "UPS Next Day Air Saturday Delivery (by 12pm)",
      "UPS Next Day Air Saver (by 4:30pm)",
      "UPS Next Day Early AM (by 8:30am)",
      "UPS standard ",
      "UPS Surepost",
      "USPS Ground Advantage",
      "USPS Priority Mail",
      "USPS Priority Mail International",
      "Vendor Prepaid",
    ],
  },
  {
    label: "Shipping Terms",
    id: "shipterms",
    type: "select",
    options: [
      "Standard",
      "Collect",
      "No Charge",
      "3rd Party",
      "Vendor Prepaid",
      "Flat UPS $1.00/unit",
      "Flat UPS $1.75/unit",
      "Flat UPS $.75/unit",
      "Flat UPS $2.00/unit",
      "Flat UPS $1.50/unit",
      "Truck Standard",
      "Custom Rate",
      "Flat UPS $1.25/unit",
      "Flat FedEx $.75/unit",
      "Flat FedEx $1.00/unit",
      "Flat FedEx $1.25/unit",
      "Flat FedEx $1.75/unit",
      "Flat FedEx $2.00/unit",
      "Flat FedEx $.50/unit",
    ],
  },
  { label: "Correct PO", id: "correctPO" },
  { label: "Correct Ship to address", id: "correctshiptoaddress" },
  { label: "Special Instructions", id: "specialins", type: "select" },
  { label: "Check Available Stock", id: "checkStock", type: "select" },
  { label: "Backorders on Separate SO", id: "backorder", type: "select" },
  { label: "Price Match with ACE", id: "pricematch", type: "select" },
  { label: "Logo Size / Tolerance", id: "logosize", type: "select" },
  { label: "Bucket Order with Band", id: "bucketorder", type: "select" },
  { label: "Component Art", id: "ComponentArt", type: "select" },
  { label: "Labels / Hang Tags", id: "hangtags", type: "select" },
  {
    label: "Color PDF/Component art uploaded to NetSuite",
    id: "colorpdf",
    type: "select",
  },
];

const ChecklistForm = () => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [tapes, setTapes] = useState<string[]>([""]);

  useEffect(() => {
    const raw = localStorage.getItem("checklistData");
    if (!raw) return;

    const data = JSON.parse(raw);

    setForm((prev) => ({
      ...prev,
      SO: data.cc || "",
      CorrectOrder: data.oe || "",
      shipDate: data.shipDate || "",
      shipMethod: data.shipMethod || "",
      shipterms: data.shipterms || "",
      correctPO: data.correctPO || "",
      correctshiptoaddress: data.shipToAddress || "",
    }));

    if (data.tape) {
      const tapeList = data.tape
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);

      setTapes(tapeList);
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleTapeChange = (index: number, value: string) => {
    const updated = [...tapes];
    updated[index] = value;
    setTapes(updated);
  };

  const addTape = () => setTapes([...tapes, ""]);

  const removeTape = (index: number) => {
    setTapes((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper function to draw checklist fields
    const drawField = (label: string, value: string, currentY: number) => {
      // 1. Draw square bullet and label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const bulletX = 30;
      const labelX = 35;

      // Draw a small solid square bullet (1.0mm x 1.0mm)
      doc.setFillColor(0, 0, 0);
      doc.rect(bulletX, currentY - 2.2, 1.0, 1.0, "F");

      // Draw label text
      doc.text(label, labelX, currentY);

      // 2. Draw value text and underline
      const valStartX = 125;
      const textVal = value.trim() ? value : "NA";
      const maxWidth = pageWidth - valStartX - 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Split text if it exceeds max width
      const wrappedLines = doc.splitTextToSize(textVal, maxWidth);
      
      // Draw the text first
      doc.text(wrappedLines, valStartX, currentY);
      
      // Calculate the longest line width for the underline
      let longestLineWidth = 0;
      wrappedLines.forEach((line: string) => {
        const lineWidth = doc.getTextWidth(line);
        if (lineWidth > longestLineWidth) {
          longestLineWidth = lineWidth;
        }
      });
      
      const underlineLength = longestLineWidth + 1;
      
      // Draw thin underline that matches the longest text line
      doc.setLineWidth(0.2);
      doc.setDrawColor(0, 0, 0);
      doc.line(valStartX, currentY + 1, valStartX + underlineLength, currentY + 1);
    };

    // 1. Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    const titleY = 25;
    doc.text(CHECKLIST_TITLE, pageWidth / 2, titleY, { align: "center" });

    // 2. SO # on left side above ORDER ENTRY
    const soY = 44;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const soLabel = "SO #";
    const soValue = form.SO.trim() ? form.SO : "NA";

    const soLabelWidth = doc.getTextWidth(soLabel + " ");
    const valWidth = doc.getTextWidth(soValue);
    const soUnderlineLength = Math.max(25, valWidth + 4);
    const soStartX = 22;

    doc.text(soLabel, soStartX, soY);

    const lineStartX = soStartX + soLabelWidth;
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);
    doc.line(lineStartX, soY + 1, lineStartX + soUnderlineLength, soY + 1);

    doc.setFont("helvetica", "normal");
    doc.text(soValue, lineStartX + 2, soY);

    // 3. ORDER ENTRY heading
    const oeHeadingY = 55;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ORDER ENTRY", 22, oeHeadingY);
    const headingWidth = doc.getTextWidth("ORDER ENTRY");
    doc.setLineWidth(0.3);
    doc.line(22, oeHeadingY + 1.2, 22 + headingWidth, oeHeadingY + 1.2);

    // 4. Checklist Items
    drawField("Correct Order #", form.CorrectOrder, 65, );

    // Correct Ship Date with sub-label
    drawField("Correct Ship Date", form.shipDate, 73);
    doc.setFont("helvetica", "oblique");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text("(Updated to today's current ship date)", 35, 77.2,);

    // Shipping Methods & Terms (combine shipMethod and shipterms if both present)
    const shipMethodVal = form.shipMethod && form.shipterms 
      ? `${form.shipMethod} / ${form.shipterms}` 
      : (form.shipMethod || form.shipterms || "");
    drawField("Correct Ship Method & Terms", shipMethodVal, 83);

    drawField("Correct PO#", form.correctPO, 91);
    drawField("Correct Ship to address", form.correctshiptoaddress, 99);
    drawField("Special Instructions", form.specialins, 107);
    drawField("Check available stock", form.checkStock, 115);
    drawField("Backorders are placed on separate SO", form.backorder, 123);
    drawField("Price Matches ACE order copy", form.pricematch, 131);

    const tapeVal = tapes.filter(Boolean).join(" / ");
    drawField("Correct tape/component#", tapeVal, 139);

    drawField("Logo Size / Tolerance for Item", form.logosize, 147);
    drawField("Bucket order with band", form.bucketorder, 155);
    drawField("Component Art", form.ComponentArt, 163);
    drawField("Labels / Hang Tags", form.hangtags, 171);
    drawField("Color PDF/Component art uploaded to NetSuite", form.colorpdf, 179);

    // 5. OE CSR Signature Section at bottom
    const oeCsrY = 190;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OE CSR :", 20, oeCsrY );

    const oeCsrLabelWidth = doc.getTextWidth("OE CSR :");
    const csrLineStartX = 22 + oeCsrLabelWidth;
    const csrValue = form.oecsr.trim() ? form.oecsr : "NA";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    
    // Draw the CSR value text first
    doc.text(csrValue, csrLineStartX, oeCsrY);
    
    // Measure the actual text width
    const csrValueWidth = doc.getTextWidth(csrValue);
    const csrUnderlineLength = csrValueWidth + 2;

    // Draw thin underline that matches text length
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);
    doc.line(csrLineStartX, oeCsrY + 1, csrLineStartX + csrUnderlineLength, oeCsrY + 1);

    // 6. Save and Reset
    doc.save(`Checklist CC# ${form.SO || "NA"}.pdf`);
    setForm({ ...initialFormState });
    setTapes([""]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderField = (field: FieldConfig) => {
    const value = form[field.id];

    return (
      <div key={field.id} className="flex flex-col text-white">
        <label htmlFor={field.id} className="mb-1 text-sm font-medium">
          {field.label}
        </label>
        {field.type === "select" ? (
          <select
            id={field.id}
            value={value}
            onChange={handleChange}
            className="rounded border border-gray-400 bg-white p-2 text-black"
          >
            <option value="">-- Select --</option>
            {(field.options ?? ["YES", "NA"]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === "date" ? (
          <DatePicker
            selected={
  value
    ? (() => {
        const d = parse(value, "MM/dd/yyyy", new Date());
        return isValid(d) ? d : null;
      })()
    : null
}
            onChange={(date) =>
              setForm((prev) => ({
                ...prev,
                [field.id]: date ? format(date, "MM/dd/yyyy") : "",
              }))
            }
            dateFormat="MM/dd/yyyy"
            placeholderText="Select Date"
            className="rounded border border-gray-400 p-2 text-black"
          />
        ) : (
          <input
            id={field.id}
            value={value}
            onChange={handleChange}
            className="rounded border border-gray-400 bg-white p-2 text-black placeholder-gray-300"
          />
        )}
      </div>
    );
  };

  return (
    <div className="galaxy-shell">
      <Galaxy
        mouseInteraction
        density={1.1}
        glowIntensity={0.36}
        saturation={0.15}
        speed={1.15}
        rotationSpeed={0.06}
        className="opacity-100"
      />

      <div className="neon-border-card relative z-10 w-full max-w-xl rounded-2xl bg-black/80 p-8 text-white shadow-[0_0_40px_rgba(0,0,0,0.15)]">
        <h2 className="mb-4 text-center text-xl font-bold">{CHECKLIST_TITLE}</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 items-start">
          {fields.map((field) => {
            const fieldElement = renderField(field);

            if (field.id === "pricematch") {
              return (
                <Fragment key={field.id}>
                  {fieldElement}
                  <div className="mt-4 md:col-span-2 flex flex-col items-center">
                    <label className="mb-2 text-center font-semibold text-white">
                      Correct tape/component:
                    </label>
                    <div className="space-y-2">
                      {tapes.map((tape, index) => (
                        <div key={index} className="mt-2 flex justify-center">
                          <input
                            type="text"
                            value={tape}
                            placeholder="Tape"
                            onChange={(e) => handleTapeChange(index, e.target.value)}
                            className="w-full max-w-md rounded border bg-white p-2 text-black"
                          />
                          {tapes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTape(index)}
                              className="text-red-500"
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addTape}
                      className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ➕ Add Tape
                    </button>
                  </div>
                </Fragment>
              );
            }

            {/* colorpdf + OE CSR share the last row */}
            if (field.id === "colorpdf") {
              return (
                <Fragment key={field.id}>
                  {fieldElement}
                  <div className="flex flex-col text-white">
                    <label htmlFor="oecsr" className="mb-1 text-sm font-medium">
                      OE CSR
                    </label>
                    <select
                      id="oecsr"
                      value={form.oecsr}
                      onChange={handleChange}
                      className="rounded border border-gray-400 bg-white p-2 text-black"
                    >
                      <option value="">-- Select --</option>
                      <option value="Owaiz">Owaiz</option>
                      <option value="Shabnaz">Shabnaz</option>
                      
                    </select>
                  </div>
                </Fragment>
              );
            }

            return fieldElement;
          })}
        </div>

        {/* Premium Download Button */}
        <div className="download-wrap">
          <button id="download-btn" className="download-btn" onClick={generatePDF}>
            <span className="download-btn__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </span>
            <span className="download-btn__text">
              Download Checklist PDF
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistForm;
