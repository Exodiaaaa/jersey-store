import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildCustomerWhatsAppUrl,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppPhoneNumber,
} from "../../src/lib/whatsapp";
import { makeCartItem, makeCustomer } from "../helpers/fixtures";

describe("whatsapp helpers", () => {
  test("genere un message de commande avec les lignes, le client et le total", () => {
    const message = buildWhatsAppMessage(
      [
        makeCartItem({
          flocking: {
            mode: "custom",
            name: "Bellingham",
            number: "5",
            note: "Police blanche",
          },
          quantity: 1,
          unitPrice: 388,
        }),
      ],
      makeCustomer(),
      388,
    );

    assert.match(message, /Produit 1 : Pack Real Madrid Home/);
    assert.match(message, /Nom : Bellingham/);
    assert.match(message, /Numero : 5/);
    assert.match(message, /Avance flocage : Oui/);
    assert.match(message, /Nom client : Imran Test/);
    assert.match(message, /Total :/);
  });

  test("encode le message dans une URL wa.me", () => {
    const url = buildWhatsAppUrl("Bonjour KVN Footwear");

    assert.equal(url, "https://wa.me/212617311976?text=Bonjour%20KVN%20Footwear");
  });

  test("normalise les numeros marocains pour contacter le client depuis le back-office", () => {
    assert.equal(normalizeWhatsAppPhoneNumber("06 00 00 00 00"), "212600000000");
    assert.equal(normalizeWhatsAppPhoneNumber("+212 617-311976"), "212617311976");
    assert.equal(normalizeWhatsAppPhoneNumber("00212 617-311976"), "212617311976");
    assert.equal(
      buildCustomerWhatsAppUrl("Commande KVN", "0600000000"),
      "https://wa.me/212600000000?text=Commande%20KVN",
    );
  });
});
