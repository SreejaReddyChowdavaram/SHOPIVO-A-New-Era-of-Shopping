# Literature Review

## AI-Powered Fraud Detection in E-Commerce

**Status**: In Progress

---

## 1. Problem Domain

Online fraud costs the global e-commerce industry billions of dollars annually. Traditional rule-based systems (e.g., block if transaction amount > $X from a new account) suffer from:
- High false-positive rates (legitimate customers blocked)
- Easy circumvention by sophisticated fraudsters
- Inability to detect novel fraud patterns

Machine learning approaches offer significant improvements but most treat transactions as independent — ignoring the relational structure between customers, sellers, products, and payment methods.

---

## 2. Graph-Based Approaches

### Why Graphs?
E-commerce transactions naturally form a graph:
- Nodes: customers, sellers, products, payment accounts, IP addresses, devices
- Edges: "purchased", "reviewed", "paid with", "shipped to", "used device"

Fraudsters often form clusters in this graph — groups of fake accounts that review each other's products, share payment methods, or exhibit coordinated behavior.

---

## 3. Key Papers to Review

| Paper | Year | Relevance |
|-------|------|-----------|
| GNN-based fraud detection (various) | 2020-2024 | Foundation |
| CSGAD: Cross-view Contrastive Graph learning for Anomaly Detection | 2023-2024 | Core model |
| Graph Convolutional Networks for fraud detection | 2021+ | GNN basics |
| Heterogeneous graph neural networks | 2020+ | Multi-type nodes |
| Fake review detection via graph analysis | 2022+ | Review fraud |

---

## 4. CSGAD Overview

> Detailed notes in `csgad.md`

CSGAD introduces:
1. **Dual-view construction**: Creates a structural view (connection topology) and a semantic view (feature similarity) of the same transaction graph
2. **Contrastive learning**: Trains the model to agree on normal nodes between views and disagree on anomalous nodes
3. **Anomaly scoring**: Nodes with high disagreement between views are flagged as anomalous

---

## 5. Resources

- [ ] Read CSGAD original paper
- [ ] Review PyTorch Geometric documentation
- [ ] Review NetworkX for graph construction
- [ ] Review FastAPI for serving predictions
- [ ] Survey existing fraud detection benchmarks (e.g., Amazon review dataset, IEEE-CIS fraud dataset)

---

*This document will be expanded throughout Semester 1 in preparation for Semester 2 implementation.*
