import jsPDF from "jspdf";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from "date-fns";
import { Fragment, useState, type ChangeEvent } from "react";
import Galaxy from "./components/Galaxy";

const CHECKLIST_TITLE = "Outsourcing OE Checklist - DOMESTIC";

const initialFormState = {
  SO: "",
  CorrectOrder: "",
  correctPO: "",
  correctshiptoaddress: "",
  shipDate: "",
  shipMethod: "FedEx Ground",
  shipVia: "Standard",
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
};

type FormState = typeof initialFormState;

type Tape = {
  prefix: string;
  code: string;
};

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
    label: "Shipping Via",
    id: "shipVia",
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
  { label: "OE CSR", id: "oecsr", type: "select", options: ["OWAIZ"] },
];

const ChecklistForm = () => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [tapes, setTapes] = useState<Tape[]>([{ prefix: "", code: "" }]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
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
    setTapes((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleWidth = doc.getTextWidth(CHECKLIST_TITLE);
    const centerX = (pageWidth - titleWidth) / 2;

    doc.text(CHECKLIST_TITLE, centerX, y);
    y += 10;

    const lines = [
      `SO #: ${form.SO}`,
      "ORDER ENTRY",
      `- Correct Order #: ${form.CorrectOrder}`,
      `- Correct PO: ${form.correctPO}`,
      `- Correct Ship to address: ${form.correctshiptoaddress}`,
      `- Correct Ship Date: ${form.shipDate}`,
      `- Correct Ship Method & Terms: ${form.shipMethod}`,
      `- Shipping Via: ${form.shipVia}`,
      `- Special Instructions: ${form.specialins}`,
      `- Check available stock: ${form.checkStock}`,
      `- Backorders are placed on separate SO: ${form.backorder}`,
      `- Price Matches ACE order copy: ${form.pricematch}`,
      `- Correct tape/component: ${tapes
        .map((tape) => `${tape.prefix}${tape.code}`)
        .filter(Boolean)
        .join(" / ")}`,
      `- Logo Size / Tolerance for Item: ${form.logosize}`,
      `- Bucket order with band: ${form.bucketorder}`,
      `- Component Art: ${form.ComponentArt}`,
      `- Labels / Hang Tags: ${form.hangtags}`,
      `- Color PDF/Component art uploaded to NetSuite: ${form.colorpdf}`,
      `* OE CSR ${form.oecsr}`,
    ];

    doc.setFontSize(12);

    lines.forEach((line) => {
      doc.text(line, 10, y);
      y += 10;
    });

    doc.save(`Checklist CC# ${form.SO}.pdf`);
    setForm({ ...initialFormState });
    setTapes([{ prefix: "", code: "" }]);
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
            selected={value ? parse(value, "MM-dd-yyyy", new Date()) : null}
            onChange={(date) =>
              setForm((prev) => ({
                ...prev,
                [field.id]: date ? format(date, "MM-dd-yyyy") : "",
              }))
            }
            dateFormat="MM-dd-yyyy"
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const fieldElement = renderField(field);

            if (field.id === "pricematch") {
              return (
                <Fragment key={field.id}>
                  {fieldElement}
                  <div className="mt-4 md:col-span-2">
                    <label className="font-semibold text-white">
                      Correct tape/component:
                    </label>
                    <div className="space-y-2">
                      {tapes.map((tape, index) => (
                        <div key={index} className="mt-2 flex gap-2">
                          <select
                            value={tape.prefix}
                            onChange={(e) =>
                              handleTapeChange(index, "prefix", e.target.value)
                            }
                            className="w-1/4 rounded border bg-white p-2 text-black"
                          >
                            <option value="">Prefix</option>
                            <option value="E">E</option>
                            <option value="3D">3D</option>
                            <option value="DTT">RTP</option>
                            <option value="EP">V</option>
                            <option value="EP">TF</option>
                            
                          </select>
                          <input
                            type="text"
                            value={tape.code}
                            placeholder="Tape"
                            onChange={(e) =>
                              handleTapeChange(index, "code", e.target.value)
                            }
                            className="w-2/4 rounded border bg-white p-2 text-black"
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
                      className="mt-2 text-blue-600"
                    >
                      ➕ Add Tape
                    </button>
                  </div>
                </Fragment>
              );
            }

            return fieldElement;
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={generatePDF}
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            📄 Download Checklist CC# {form.SO || ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistForm;
