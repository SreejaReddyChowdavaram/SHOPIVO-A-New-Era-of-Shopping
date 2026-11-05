# CSGAD Research Notes

## Cross-View Contrastive Graph Learning for Anomaly Detection

**Status**: Reserved for Semester 2  
**Purpose**: Research notes and implementation planning for the fraud detection AI model

---

## 1. What is CSGAD?

CSGAD (Cross-view Contrastive Graph learning for Anomaly Detection) is a graph-based anomaly detection framework that:

1. Constructs **two views** of the same graph:
   - **Structural view**: Based on the topology of connections (who connects to whom)
   - **Semantic view**: Based on the similarity of node features (behavioral patterns)

2. Uses **contrastive learning** to train the model:
   - Normal nodes should produce consistent representations across both views
   - Anomalous nodes produce inconsistent representations (they "look normal" in one view but not the other)

3. Computes an **anomaly score** from the cross-view disagreement

---

## 2. Application to E-Commerce Fraud

### Graph Construction

Nodes:
- Customers (user accounts)
- Sellers (merchant accounts)
- Products
- Payment accounts/cards
- IP addresses / devices

Edges (typed):
- Customer → Product: "purchased"
- Customer → Product: "reviewed"
- Customer → Seller: "transacted with"
- Customer → PaymentAccount: "paid with"
- Customer → IPAddress: "logged in from"

### Structural View
Captures the network topology: is this customer connected to known fraudsters? Do they share accounts with suspended users?

### Semantic View
Captures feature similarity: does this customer's behavior (purchase frequency, review patterns, transaction amounts) resemble known fraud patterns?

---

## 3. Fraud Signals CSGAD Can Detect

| Signal | Description |
|--------|-------------|
| Coordinated fake reviews | Group of accounts reviewing the same products positively |
| Account takeover | Sudden behavioral shift from normal pattern |
| Payment fraud | Shared payment accounts across multiple "different" customers |
| Seller fraud | Sellers with unusual refund/return rates |
| New account fraud | Accounts created in bulk with similar behavioral patterns |

---

## 4. Implementation Plan (Semester 2)

```
Transaction Data
       ↓
Feature Engineering (Python/Pandas)
       ↓
Graph Construction (NetworkX)
       ↓
CSGAD Model Training (PyTorch + PyG)
       ↓
Model Serving (FastAPI)
       ↓
Fraud Score API
       ↓
Spring Boot Risk Engine
       ↓
Order Decision (Approve / Review / Reject)
```

---

## 5. Technology Choices

| Component | Technology | Reason |
|-----------|-----------|--------|
| Graph construction | NetworkX | Flexible, Python-native |
| GNN framework | PyTorch Geometric (PyG) | Industry standard for GNNs |
| Model training | PyTorch | CSGAD implementation |
| API serving | FastAPI | Fast, async, Python-native |
| Communication | REST JSON | Simple integration with Spring Boot |

---

## 6. Reading List

- [ ] CSGAD original paper (search: "Cross-view Contrastive Graph Anomaly Detection")
- [ ] "Semi-supervised Graph Attention Networks for Graph-level Anomaly Detection" 
- [ ] PyTorch Geometric documentation: https://pytorch-geometric.readthedocs.io/
- [ ] "Fraud Detection on Financial Transactions with Machine Learning"
- [ ] Amazon Product Review Dataset (Stanford SNAP)

---

*This document will be updated with implementation details during Semester 2.*
