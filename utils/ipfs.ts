// Get this from Pinata Dashboard -> API Keys -> New Key (Admin) -> "JWT"
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzN2U0NTE5ZS1hYjVjLTQ4ODUtOGIxMy1kOGQzMjk1N2JkN2YiLCJlbWFpbCI6ImJlbi5jeW5hbW9uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1MjM1ZWE2ZTU5N2ZhNDUwMzNmNyIsInNjb3BlZEtleVNlY3JldCI6IjI1OTBhM2MyNzYxNmIxODI3OTFiMTViNjA1YzgwMGQ2ZDFhOWY2ZjY3ZTBjMjNmNmU2YmUyMDg5YjVjNDRkMTMiLCJleHAiOjE3OTcyNjcyOTR9.CY8eLtCNCpXD-gLsD7y4P9o8MRJjBZLVKoB1vCdzW7w"; 

export const uploadToIPFS = async (data: any) => {
  try {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const formData = new FormData();
    formData.append("file", blob, "metadata.json");

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    };

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", options);
    const response = await res.json();
    
    // Return the IPFS Hash (CID)
    return response.IpfsHash;
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    return null;
  }
};

export const fetchFromIPFS = async (cid: string) => {
    // Uses a public gateway. For production, use a dedicated gateway if possible.
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    return await res.json();
}