import os
from langchain_community.document_loaders import PyPDFLoader

from dotenv import load_dotenv

from collections import defaultdict
import re
from langchain.schema import Document

# Set up OpenAI API key
load_dotenv()


def process_pdf(file_path):
    print(f"Processing: {file_path}")
    loader = PyPDFLoader(file_path)
    pages = loader.load_and_split()
    return pages


def reorganize_documents(documents):
    # Group documents by source
    grouped_docs = defaultdict(list)
    for doc in documents:
        grouped_docs[doc.metadata["source"]].append(doc)

    # Combine content for each source
    combined_docs = []
    for source, docs in grouped_docs.items():
        combined_content = "\n".join(doc.page_content for doc in docs)
        combined_docs.append(
            Document(page_content=combined_content, metadata={"source": source})
        )

    final_docs = []
    for doc in combined_docs:
        # Split the content using regex
        splits = re.split(r"\n(\d+\.)", doc.page_content)

        # Process the splits
        for i in range(1, len(splits), 2):
            question_num = splits[i].strip(".")
            content = (
                splits[i + 1].strip().replace("\n", " ") if i + 1 < len(splits) else ""
            )

            final_docs.append(
                Document(
                    page_content=content,
                    metadata={
                        "source": doc.metadata["source"],
                        "question_number": question_num,
                    },
                )
            )

        # Add any content before the first numbered question
        if splits[0].strip():
            final_docs.append(
                Document(
                    page_content=splits[0].strip(),
                    metadata={"source": doc.metadata["source"]},
                )
            )

    print(f"Number of documents after reorganization: {len(final_docs)}")
    return final_docs


def parse_pdf(pdf_directory: str) -> list:
    """Parse all pdf files in a directory and reorganize the documents

    Args:
        pdf_directory (str): The directory containing the pdf files

    Returns:
        list: A list of reorganized documents : langchain.schema.Document
        Document(page_content="", metadata={"source": "file_path", "question_number": "1"})
    """
    all_pages = []

    # Process all PDF files in the directory
    for filename in os.listdir(pdf_directory):
        if filename.endswith(".pdf"):
            file_path = os.path.join(pdf_directory, filename)
            pages = process_pdf(file_path)
            all_pages.extend(pages)

    print(f"Number of pages before reorganization: {len(all_pages)}")

    # Reorganize documents
    reorganized_docs = reorganize_documents(all_pages)
    return reorganized_docs


def main():
    pdf_directory = "/Users/badrou/repository/david_goggins_pocket/poc/data/"
    reorganized_docs = parse_pdf(pdf_directory)

    all_pages = []

    # Process all PDF files in the directory
    for filename in os.listdir(pdf_directory):
        if filename.endswith(".pdf"):
            file_path = os.path.join(pdf_directory, filename)
            print(" processing file_path : ", file_path)
            pages = process_pdf(file_path)
            all_pages.extend(pages)

    all_pages

    # Print reorganized documents
    for i, doc in enumerate(reorganized_docs):
        print(f"Document {i + 1}:")
        print(f"Source: {doc.metadata['source']}")
        if "question_number" in doc.metadata:
            print(f"Question Number: {doc.metadata['question_number']}")
        print(f"Content preview: {doc.page_content[:100]}...")
        print("-" * 50)

    # # Create a vector store from reorganized documents
    # vector_store = create_vector_store(reorganized_docs)

    # # Example search
    # query = "What is the main topic of these documents?"
    # print("\nPerforming search...")
    # search_documents(vector_store, query)


if __name__ == "__main__":
    main()

    loader = PyPDFLoader(
        "/Users/badrou/repository/david_goggins_pocket/poc/data/FAQ_traiteu.pdf"
    )
    loader.load()
    pages = loader.load_and_split()
    pages[0].page_content
    print(pages[0].page_content)
